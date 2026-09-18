import { Task, Resource, DriveSheetFile } from '../types';

/**
 * Creates a new Google Spreadsheet formatted with "Tasks" and "Resources" sheets.
 */
export async function createProjectSpreadsheet(
  accessToken: string,
  projectTitle: string,
  tasks: Task[],
  resources: Resource[]
): Promise<{ id: string; url: string; name: string }> {
  const title = projectTitle ? `${projectTitle} - Project Plan` : 'Project Plan (MS Project)';

  // 1. Create spreadsheet with two sheets: Tasks and Resources
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Tasks',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: 'Resources',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Spreadsheet: ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const webViewLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate data in the newly created spreadsheet
  await exportToGoogleSheets(accessToken, spreadsheetId, tasks, resources);

  // 3. Format header styling via batchUpdate
  try {
    const tasksSheetId = sheetData.sheets?.[0]?.properties?.sheetId ?? 0;
    const resourcesSheetId = sheetData.sheets?.[1]?.properties?.sheetId ?? 1;

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Format Tasks header row
          {
            repeatCell: {
              range: {
                sheetId: tasksSheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.35, blue: 0.65 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          // Format Resources header row
          {
            repeatCell: {
              range: {
                sheetId: resourcesSheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.18, green: 0.45, blue: 0.38 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
        ],
      }),
    });
  } catch (fmtErr) {
    console.warn('Optional header styling batch update warning:', fmtErr);
  }

  return {
    id: spreadsheetId,
    url: webViewLink,
    name: title,
  };
}

/**
 * Exports tasks and resources to an existing Google Spreadsheet.
 */
export async function exportToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  tasks: Task[],
  resources: Resource[]
): Promise<void> {
  const resourceMap = new Map<string, string>();
  resources.forEach((r) => resourceMap.set(r.id, r.name));

  // Prepare Tasks rows
  const taskHeaders = [
    'ID',
    'WBS',
    'Task Name / ຊື່ໜ້າວຽກ',
    'Duration (Days) / ໄລຍະເວລາ (ມື້)',
    'Start Date / ວັນທີເລີ່ມ',
    'End Date / ວັນທີສິ້ນສຸດ',
    'Progress (%) / ຄວາມຄືບໜ້າ',
    'Status / ສະຖານະ',
    'Priority / ບຸລິມະສິດ',
    'Assignees / ຜູ້ຮັບຜິດຊອບ',
    'Predecessors / ວຽກກ່ອນໜ້າ',
    'Is Milestone / ຈຸດໝາຍ',
    'Notes / ໝາຍເຫດ',
    'Parent ID',
    'Indent Level',
  ];

  const taskRows = tasks.map((t) => [
    t.id,
    t.wbs,
    '  '.repeat(t.indent || 0) + t.name,
    t.duration,
    t.startDate,
    t.endDate,
    `${t.progress}%`,
    t.status,
    t.priority,
    t.assigneeIds.map((id) => resourceMap.get(id) || id).join(', '),
    t.predecessors.join(', '),
    t.isMilestone ? 'YES' : 'NO',
    t.notes || '',
    t.parentId || '',
    t.indent || 0,
  ]);

  // Prepare Resources rows
  const resourceHeaders = [
    'Resource ID',
    'Name / ຊື່',
    'Role / ຕຳແໜ່ງ',
    'Email / ອີເມລ',
    'Type / ປະເພດ',
    'Capacity (%) / ຄວາມສາມາດ',
    'Hourly Rate ($) / ອັດຕາຄ່າຈ້າງຕໍ່ຊົ່ວໂມງ',
  ];

  const resourceRows = resources.map((r) => [
    r.id,
    r.name,
    r.role,
    r.email,
    r.type,
    `${r.capacity}%`,
    r.hourlyRate,
  ]);

  // Clear Tasks and Resources ranges first to avoid leftover rows
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tasks!A1:Z500:clear`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Resources!A1:Z500:clear`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  } catch (clearErr) {
    console.warn('Range clear notice:', clearErr);
  }

  // Update Tasks data
  const taskValues = [taskHeaders, ...taskRows];
  const updateTasksRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tasks!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Tasks!A1',
        majorDimension: 'ROWS',
        values: taskValues,
      }),
    }
  );

  if (!updateTasksRes.ok) {
    const errText = await updateTasksRes.text();
    throw new Error(`Failed to write tasks to sheet: ${errText}`);
  }

  // Update Resources data
  const resourceValues = [resourceHeaders, ...resourceRows];
  const updateResRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Resources!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Resources!A1',
        majorDimension: 'ROWS',
        values: resourceValues,
      }),
    }
  );

  if (!updateResRes.ok) {
    const errText = await updateResRes.text();
    console.warn(`Failed to write resources to sheet: ${errText}`);
  }
}

/**
 * Imports tasks and resources from a Google Spreadsheet.
 */
export async function importFromGoogleSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<{ tasks: Task[]; resources: Resource[] }> {
  // Fetch Tasks tab
  const tasksRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tasks!A1:Z500`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!tasksRes.ok) {
    throw new Error(`Could not access 'Tasks' sheet in spreadsheet. Please verify permissions.`);
  }

  const tasksJson = await tasksRes.json();
  const taskRows: string[][] = tasksJson.values || [];

  // Fetch Resources tab
  let resourceRows: string[][] = [];
  try {
    const resRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Resources!A1:Z500`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (resRes.ok) {
      const resJson = await resRes.json();
      resourceRows = resJson.values || [];
    }
  } catch (e) {
    console.warn('Could not read Resources tab:', e);
  }

  // Parse resources
  const resources: Resource[] = [];
  const nameToResourceId = new Map<string, string>();

  if (resourceRows.length > 1) {
    for (let i = 1; i < resourceRows.length; i++) {
      const row = resourceRows[i];
      if (!row || !row[1]) continue;
      const id = row[0] || `res-${i}`;
      const name = (row[1] || '').trim();
      const role = row[2] || 'Team Member';
      const email = row[3] || '';
      const type = (row[4]?.toLowerCase() === 'material' ? 'material' : row[4]?.toLowerCase() === 'cost' ? 'cost' : 'work') as any;
      const capacity = parseInt(String(row[5] || '100').replace('%', ''), 10) || 100;
      const hourlyRate = parseFloat(row[6] || '0') || 0;

      const palette = ['#2563EB', '#16A34A', '#D97706', '#9333EA', '#DC2626', '#0891B2'];
      const avatarColor = palette[i % palette.length];

      resources.push({
        id,
        name,
        role,
        email,
        type,
        capacity,
        hourlyRate,
        avatarColor,
      });
      nameToResourceId.set(name.toLowerCase(), id);
      nameToResourceId.set(id, id);
    }
  }

  // Parse tasks
  const tasks: Task[] = [];
  if (taskRows.length > 1) {
    for (let i = 1; i < taskRows.length; i++) {
      const row = taskRows[i];
      if (!row || !row[2]) continue;

      const id = row[0] || `task-${i}`;
      const wbs = row[1] || `${i}`;
      const rawName = row[2] || '';
      const name = rawName.trim();
      const duration = parseFloat(row[3] || '1') || 1;
      const startDate = row[4] || new Date().toISOString().split('T')[0];
      const endDate = row[5] || startDate;
      const progress = parseInt(String(row[6] || '0').replace('%', ''), 10) || 0;
      const statusRaw = (row[7] || 'not_started').toLowerCase().trim();
      const status = (['not_started', 'in_progress', 'completed', 'on_hold', 'delayed'].includes(statusRaw)
        ? statusRaw
        : progress >= 100
        ? 'completed'
        : progress > 0
        ? 'in_progress'
        : 'not_started') as any;

      const priorityRaw = (row[8] || 'medium').toLowerCase().trim();
      const priority = (['low', 'medium', 'high', 'urgent'].includes(priorityRaw)
        ? priorityRaw
        : 'medium') as any;

      const rawAssignees = row[9] ? row[9].split(',').map((s) => s.trim()) : [];
      const assigneeIds: string[] = [];
      rawAssignees.forEach((a) => {
        const matched = nameToResourceId.get(a.toLowerCase()) || nameToResourceId.get(a);
        if (matched) assigneeIds.push(matched);
        else if (a) assigneeIds.push(a);
      });

      const predecessors = row[10] ? row[10].split(',').map((s) => s.trim()).filter(Boolean) : [];
      const isMilestone = (row[11] || '').toUpperCase() === 'YES' || duration === 0;
      const notes = row[12] || '';
      const parentId = row[13] || null;
      const indent = parseInt(row[14] || '0', 10) || (rawName.startsWith('    ') ? 2 : rawName.startsWith('  ') ? 1 : 0);

      tasks.push({
        id,
        wbs,
        name,
        parentId,
        indent,
        startDate,
        endDate,
        duration,
        progress,
        status,
        priority,
        assigneeIds,
        predecessors,
        notes,
        isMilestone,
      });
    }
  }

  return { tasks, resources };
}

/**
 * Lists user spreadsheets from Google Drive to allow opening/linking an existing sheet.
 */
export async function listDriveSpreadsheets(accessToken: string): Promise<DriveSheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,modifiedTime,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('Failed to list drive spreadsheets:', errText);
    return [];
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    modifiedTime: f.modifiedTime,
    webViewLink: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`,
  }));
}

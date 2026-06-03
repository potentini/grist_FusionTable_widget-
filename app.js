/* global grist */
const TARGET_TABLE = 'Planning_Items';

const DEFAULT_CONFIG = {
  sources: [
    {
      tableId: 'Projets',
      level: 1,
      keyPrefix: 'P',
      parent: null,
      fields: {
        name: ['Nom', 'Name', 'Titre', 'Title', 'Projet'],
        start: ['Date_debut', 'Debut', 'Start', 'Start_Date', 'Date début'],
        end: ['Date_fin', 'Fin', 'End', 'End_Date', 'Date fin'],
        status: ['Statut', 'Status', 'Etat'],
        responsible: ['Responsable', 'Responsible', 'Owner', 'Assigné'],
        progress: ['Avancement', 'Progress', 'Progression', 'Pourcentage'],
      },
    },
    {
      tableId: 'Taches',
      level: 2,
      keyPrefix: 'T',
      parent: { tableId: 'Projets', keyPrefix: 'P', fields: ['Projet', 'Projet_ID', 'Project', 'Parent', 'Parent_ID'] },
      fields: {
        name: ['Nom', 'Name', 'Titre', 'Title', 'Tache', 'Tâche'],
        start: ['Date_debut', 'Debut', 'Start', 'Start_Date', 'Date début'],
        end: ['Date_fin', 'Fin', 'End', 'End_Date', 'Date fin'],
        status: ['Statut', 'Status', 'Etat'],
        responsible: ['Responsable', 'Responsible', 'Owner', 'Assigné'],
        progress: ['Avancement', 'Progress', 'Progression', 'Pourcentage'],
      },
    },
    {
      tableId: 'Sous_taches',
      level: 3,
      keyPrefix: 'ST',
      parent: { tableId: 'Taches', keyPrefix: 'T', fields: ['Tache', 'Tâche', 'Tache_ID', 'Task', 'Parent', 'Parent_ID'] },
      fields: {
        name: ['Nom', 'Name', 'Titre', 'Title', 'Sous_tache', 'Sous tâche'],
        start: ['Date_debut', 'Debut', 'Start', 'Start_Date', 'Date début'],
        end: ['Date_fin', 'Fin', 'End', 'End_Date', 'Date fin'],
        status: ['Statut', 'Status', 'Etat'],
        responsible: ['Responsable', 'Responsible', 'Owner', 'Assigné'],
        progress: ['Avancement', 'Progress', 'Progression', 'Pourcentage'],
      },
    },
  ],
};

const REQUIRED_COLUMNS = [
  { id: 'Item_Key', type: 'Text' },
  { id: 'Parent_Key', type: 'Text' },
  { id: 'Level', type: 'Int' },
  { id: 'Source_Table', type: 'Text' },
  { id: 'Source_Record_ID', type: 'Int' },
  { id: 'Name', type: 'Text' },
  { id: 'Start', type: 'Date' },
  { id: 'End', type: 'Date' },
  { id: 'Status', type: 'Text' },
  { id: 'Responsible', type: 'Text' },
  { id: 'Progress', type: 'Numeric' },
  { id: 'level1Name', type: 'Text' },
  { id: 'level2Name', type: 'Text' },
  { id: 'level3Name', type: 'Text' },
  { id: 'level1Start', type: 'Date' },
  { id: 'level1End', type: 'Date' },
  { id: 'level1Status', type: 'Text' },
  { id: 'level1Responsible', type: 'Text' },
  { id: 'level1Progress', type: 'Numeric' },
  { id: 'level2Start', type: 'Date' },
  { id: 'level2End', type: 'Date' },
  { id: 'level2Status', type: 'Text' },
  { id: 'level2Responsible', type: 'Text' },
  { id: 'level2Progress', type: 'Numeric' },
  { id: 'level3Start', type: 'Date' },
  { id: 'level3End', type: 'Date' },
  { id: 'level3Status', type: 'Text' },
  { id: 'level3Responsible', type: 'Text' },
  { id: 'level3Progress', type: 'Numeric' },
  { id: 'Updated_At', type: 'DateTime:UTC' },
];

const state = { config: DEFAULT_CONFIG, busy: false };

const el = {
  button: document.getElementById('syncButton'),
  dot: document.getElementById('statusDot'),
  title: document.getElementById('statusTitle'),
  message: document.getElementById('statusMessage'),
  sourceList: document.getElementById('sourceList'),
  preparedCount: document.getElementById('preparedCount'),
  lastSync: document.getElementById('lastSync'),
};

function setStatus(kind, title, message) {
  el.dot.className = `status-dot ${kind || ''}`.trim();
  el.title.textContent = title;
  el.message.textContent = message;
}

function renderSources() {
  el.sourceList.innerHTML = '';
  for (const source of state.config.sources) {
    const item = document.createElement('li');
    item.textContent = `Niveau ${source.level} : ${source.tableId}`;
    el.sourceList.appendChild(item);
  }
}

function mergeConfig(options) {
  if (!options || !Array.isArray(options.sources)) return DEFAULT_CONFIG;
  return { ...DEFAULT_CONFIG, ...options, sources: options.sources };
}

async function ensurePlanningTable() {
  const tables = await grist.docApi.listTables();
  if (!tables.includes(TARGET_TABLE)) {
    const columns = REQUIRED_COLUMNS.map(({ id, type }) => ({ id, type, isFormula: false }));
    await grist.docApi.applyUserActions([['AddTable', TARGET_TABLE, columns]]);
    return;
  }

  const existing = await grist.docApi.fetchTable(TARGET_TABLE);
  const existingColumns = new Set(Object.keys(existing));
  const missingActions = REQUIRED_COLUMNS
    .filter(({ id }) => !existingColumns.has(id))
    .map(({ id, type }) => ['AddColumn', TARGET_TABLE, id, { type, isFormula: false }]);
  if (missingActions.length) {
    await grist.docApi.applyUserActions(missingActions);
  }
}

async function fetchRows(tableId) {
  const table = await grist.docApi.fetchTable(tableId);
  return columnarToRows(table);
}

function columnarToRows(table) {
  if (Array.isArray(table)) return table;
  const ids = table.id || [];
  return ids.map((id, index) => {
    const row = { id };
    for (const [columnId, values] of Object.entries(table)) {
      row[columnId] = values[index];
    }
    return row;
  });
}

function firstValue(row, candidates = []) {
  for (const columnId of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, columnId) && row[columnId] !== null && row[columnId] !== undefined && row[columnId] !== '') {
      return row[columnId];
    }
  }
  return null;
}

function sourceKey(source, recordId) {
  return `${source.keyPrefix}:${recordId}`;
}

function getParentKey(source, row) {
  if (!source.parent) return null;
  const rawParent = firstValue(row, source.parent.fields);
  const parentId = Array.isArray(rawParent) ? rawParent[0] : rawParent;
  return parentId ? `${source.parent.keyPrefix}:${parentId}` : null;
}

function normalizeDate(value) {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function normalizeProgress(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(String(value).replace('%', '').replace(',', '.'));
  if (!Number.isFinite(numeric)) return null;
  return numeric > 1 ? numeric / 100 : numeric;
}

function buildBaseItem(source, row) {
  return {
    Item_Key: sourceKey(source, row.id),
    Parent_Key: getParentKey(source, row),
    Level: source.level,
    Source_Table: source.tableId,
    Source_Record_ID: row.id,
    Name: firstValue(row, source.fields.name) || `${source.tableId} #${row.id}`,
    Start: normalizeDate(firstValue(row, source.fields.start)),
    End: normalizeDate(firstValue(row, source.fields.end)),
    Status: firstValue(row, source.fields.status),
    Responsible: firstValue(row, source.fields.responsible),
    Progress: normalizeProgress(firstValue(row, source.fields.progress)),
    Updated_At: Math.floor(Date.now() / 1000),
  };
}

function addTimelineFields(items) {
  const byKey = new Map(items.map((item) => [item.Item_Key, item]));
  return items.map((item) => {
    const hierarchy = [];
    let cursor = item;
    while (cursor) {
      hierarchy.unshift(cursor);
      cursor = cursor.Parent_Key ? byKey.get(cursor.Parent_Key) : null;
    }

    const fields = { ...item };
    for (const ancestor of hierarchy) {
      const level = ancestor.Level;
      fields[`level${level}Name`] = ancestor.Name;
      fields[`level${level}Start`] = ancestor.Start;
      fields[`level${level}End`] = ancestor.End;
      fields[`level${level}Status`] = ancestor.Status;
      fields[`level${level}Responsible`] = ancestor.Responsible;
      fields[`level${level}Progress`] = ancestor.Progress;
    }
    return fields;
  });
}

async function buildPlanningItems() {
  const allItems = [];
  for (const source of state.config.sources) {
    const rows = await fetchRows(source.tableId);
    allItems.push(...rows.map((row) => buildBaseItem(source, row)));
  }
  return addTimelineFields(allItems);
}

async function syncPlanningItems() {
  if (state.busy) return;
  state.busy = true;
  el.button.disabled = true;
  setStatus('busy', 'Synchronisation en cours', 'Lecture des tables source et mise à jour de Planning_Items…');

  try {
    await ensurePlanningTable();
    const items = await buildPlanningItems();
    const operations = items.map((fields) => ({ require: { Item_Key: fields.Item_Key }, fields }));
    if (operations.length) {
      await grist.getTable(TARGET_TABLE).upsert(operations, { onMany: 'first' });
    }

    el.preparedCount.textContent = String(items.length);
    el.lastSync.textContent = new Date().toLocaleString('fr-FR');
    setStatus('ok', 'Synchronisation terminée', `${items.length} ligne(s) créées ou mises à jour dans ${TARGET_TABLE}.`);
  } catch (error) {
    console.error(error);
    setStatus('error', 'Erreur de synchronisation', error.message || String(error));
  } finally {
    state.busy = false;
    el.button.disabled = false;
  }
}

el.button.addEventListener('click', syncPlanningItems);

grist.onOptions((options) => {
  state.config = mergeConfig(options);
  renderSources();
});

grist.ready({ requiredAccess: 'full' });
renderSources();

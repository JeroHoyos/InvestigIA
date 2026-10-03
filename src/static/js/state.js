/* ═══ GLOBAL STATE ════════════════════════════════════════════════════════ */
let globalPapers = [];
let sessionId = null;
let ws = null;
let currentPage = 'home';
let currentInterruptType = null;
let charts = {};
let graphMode = 'authors';
let graphZoom = null;

// Matrix page state
let globalMatrixHeaders = [];
let globalMatrixRows    = [];
let globalMatrixMD      = '';
let matrixSelRows       = new Set();
let matrixVisibleCols   = [];
let matrixSortCol       = -1;
let matrixSortAsc       = true;
let matrixSearchQ       = '';

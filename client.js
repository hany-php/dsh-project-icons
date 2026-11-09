/**
 * Client half of the project-icons bundle.
 *
 * Adds a Settings page ("Workspace settings") with three per-project controls:
 *
 * 1. A custom image icon. Images are stored in this browser's localStorage,
 *    resized to 96x96 on import, and painted into the shipped Workspace
 *    browser's project rows through a scoped stylesheet:
 *
 *      [data-row-key="workspace:<id>"] span[class*="_folder"]
 *
 *    The shipped row already owns an "active" marker: its folder cell carries a
 *    class ending in `_folderActive` while one of that Workspace's Sessions is
 *    the selected one. The stylesheet dims (grayscale + opacity) every custom
 *    icon whose cell does NOT carry that marker, so a project shows in color
 *    while it is selected and gray while it is not.
 *
 * 2. Sidebar visibility. Hidden project ids are stored beside the icons and the
 *    nearest shipped group section (`[class*="_groupSection"]`) of that project
 *    row gets `data-dsh-project-hidden="on"`, which one rule hides. A
 *    MutationObserver re-applies the marker after React re-renders the list.
 *    Hiding removes the project group (and its Sessions) from the sidebar list
 *    only; the Workspace itself, its Sessions, search and the workspace picker
 *    are untouched.
 *
 * The row key and the `_groupSection` / `_folder` class suffixes are semantic
 * shipped markers, not hashed class names. If a future dsh build changes them
 * the rules simply stop matching; the sidebar keeps working and only the
 * custom icon / hiding effect is lost.
 *
 * Module id MUST equal the package name.
 */
window.__ModuleLoader__.load({
  id: 'dsh-project-icons',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Locale namespace owned by this plugin. */
    const NS = 'projectIcons';
    /** Browser-local persistence key for the workspaceId -> data URL map. */
    const ICON_STORAGE_KEY = 'dsh.projectIcons.v1';
    /** Browser-local persistence key for the hidden workspaceId list. */
    const HIDDEN_STORAGE_KEY = 'dsh.projectIcons.hidden.v1';
    /** Document-root attribute the sidebar stylesheet keys on. */
    const ROOT_FLAG = 'data-dsh-project-icons';
    /** Id of the single stylesheet this plugin owns. */
    const STYLE_ID = 'dsh-project-icons-css';
    /** Attribute marked on the shipped group section of a hidden project. */
    const HIDDEN_ATTR = 'data-dsh-project-hidden';
    /** Shipped project-row key prefix; the ungrouped bucket uses the bare prefix. */
    const ROW_PREFIX = 'workspace:';
    /** Square edge of the stored image, in pixels. */
    const ICON_SIZE = 96;
    /** Import guard; larger files are refused before reading. */
    const MAX_FILE_BYTES = 6 * 1024 * 1024;

    /** English dictionary; the fallback for every other locale. */
    const EN = {
      'section.title': 'Workspace settings',
      'section.description':
        'Give each project its own image icon, choose which projects appear in the sidebar list, and remove projects from the workspace list. The icon shows in color while one of that project\'s sessions is selected and turns gray while the project is not selected.',
      'section.footnote':
        'Images are saved in this browser and resized to 96x96. Hiding a project only removes its group from the sidebar list. Removing a project from the workspace list never deletes its folder, files, or sessions.',
      'choose': 'Choose image',
      'removeImage': 'Remove image',
      'removeProject': 'Remove from workspace list',
      'removing': 'Removing…',
      'confirmRemove': 'Remove',
      'cancel': 'Cancel',
      'removeProject.note': 'Removes this project from the workspace list only; its folder, files, and sessions stay untouched.',
      'preview': 'Icon preview',
      'busy': 'Processing…',
      'status.active': 'Selected now',
      'status.idle': 'Not selected',
      'state.hidden': 'Hidden',
      'toggle.hide': 'Hide from the sidebar',
      'toggle.show': 'Show in the sidebar',
      'list.count': 'Shown in the list: {shown} of {total}',
      'showAll': 'Show all',
      'hideAll': 'Hide all',
      'empty.title': 'No projects yet',
      'empty.description': 'Create a workspace first; its project then appears here for a custom icon.',
      'error.notImage': 'That file is not a supported image.',
      'error.tooLarge': 'That image is too large (6 MB maximum).',
      'error.decode': 'Could not read that image.',
      'error.remove': 'Could not remove the project from the workspace list.',
      'error.save': 'The change could not be saved in this browser (storage is full).',
    };
    /** Arabic dictionary, matching the shipped UI terminology. */
    const AR = {
      'section.title': 'إعدادات مساحات العمل',
      'section.description':
        'امنح كل مشروع صورة أيقونة خاصة، واختر المشاريع التي تظهر في قائمة الشريط الجانبي، وأزل المشاريع من قائمة مساحات العمل. تظهر الأيقونة ملوّنة عندما تكون إحدى جلسات المشروع محدّدة الآن، وتتحول إلى رمادي عندما لا يكون المشروع محدّدًا.',
      'section.footnote':
        'تُحفظ الصور في هذا المتصفح وتُصغَّر إلى 96×96 بكسل. الإخفاء يزيل مجموعة المشروع من قائمة الشريط الجانبي فقط، والإزالة من مساحات العمل لا تحذف مجلد المشروع أو ملفاته أو جلساته.',
      'choose': 'اختيار صورة',
      'removeImage': 'إزالة الصورة',
      'removeProject': 'إزالة من مساحات العمل',
      'removing': 'جارٍ الإزالة…',
      'confirmRemove': 'إزالة',
      'cancel': 'إلغاء',
      'removeProject.note': 'تزيل هذا المشروع من قائمة مساحات العمل فقط؛ يبقى مجلده وملفاته وجلساته دون تغيير.',
      'preview': 'معاينة الأيقونة',
      'busy': 'جارٍ المعالجة…',
      'status.active': 'محدّد الآن',
      'status.idle': 'غير محدّد',
      'state.hidden': 'مخفي',
      'toggle.hide': 'إخفاء من الشريط الجانبي',
      'toggle.show': 'إظهار في الشريط الجانبي',
      'list.count': 'المعروض في القائمة: {shown} من {total}',
      'showAll': 'إظهار الكل',
      'hideAll': 'إخفاء الكل',
      'empty.title': 'لا توجد مشاريع بعد',
      'empty.description': 'أنشئ مساحة عمل أولًا؛ سيظهر مشروعها هنا لتختار له أيقونة.',
      'error.notImage': 'هذا الملف ليس صورة مدعومة.',
      'error.tooLarge': 'حجم الصورة كبير جدًا (6 ميجابايت كحد أقصى).',
      'error.decode': 'تعذّرت قراءة الصورة.',
      'error.remove': 'تعذّرت إزالة المشروع من قائمة مساحات العمل.',
      'error.save': 'تعذّر حفظ التغيير في هذا المتصفح (مساحة التخزين ممتلئة).',
    };

    /** Fallback translate, replaced with the locale-bound seat inside apply(). */
    let fallbackTranslate = (key) => EN[key] ?? key;

    /**
     * Replaced inside apply(). Resolves the Workspace controller lazily at call
     * time so activation order between this plugin and ui-workspace cannot
     * leave removal permanently unavailable.
     */
    let requestWorkspaceRemoval = () => Promise.reject(new Error('workspace-service-unavailable'));

    /** Resolve the reactive `t` seat a localized slot entry receives. */
    function resolveTranslate(props) {
      if (props && typeof props.t === 'function') {
        return (key) => {
          const text = props.t(key);
          return typeof text === 'string' && text !== key ? text : EN[key] ?? key;
        };
      }
      return fallbackTranslate;
    }

    /** Fill `{name}` placeholders in one localized string. */
    function formatText(template, values) {
      return String(template).replace(/\{(\w+)\}/g, (match, key) =>
        values && Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
      );
    }

    // ---------------------------------------------------------------- storage

    /** Keep only well-formed data-URL entries from an unknown stored object. */
    function sanitizeIcons(raw) {
      const out = {};
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return out;
      for (const key of Object.keys(raw)) {
        const value = raw[key];
        if (typeof key === 'string' && key !== '' && typeof value === 'string' && value.indexOf('data:image/') === 0) {
          out[key] = value;
        }
      }
      return out;
    }

    /** Keep only unique non-empty workspace ids from an unknown stored list. */
    function sanitizeHidden(raw) {
      const out = [];
      if (!Array.isArray(raw)) return out;
      for (const value of raw) {
        if (typeof value === 'string' && value !== '' && out.indexOf(value) === -1) out.push(value);
      }
      return out;
    }

    /** Read the saved icon map; unreadable or corrupt storage degrades to empty. */
    function readStoredIcons() {
      try {
        const raw = window.localStorage.getItem(ICON_STORAGE_KEY);
        if (raw === null || raw === '') return {};
        return sanitizeIcons(JSON.parse(raw));
      } catch (error) {
        return {};
      }
    }

    /** Read the saved hidden-project list; unreadable storage degrades to empty. */
    function readStoredHidden() {
      try {
        const raw = window.localStorage.getItem(HIDDEN_STORAGE_KEY);
        if (raw === null || raw === '') return [];
        return sanitizeHidden(JSON.parse(raw));
      } catch (error) {
        return [];
      }
    }

    /** In-memory source of truth, seeded before the first render. */
    let state = { icons: readStoredIcons(), hidden: readStoredHidden() };
    /** Components that want to re-render when an icon or a visibility changes. */
    const stateListeners = new Set();

    function getState() {
      return state;
    }

    function subscribeState(listener) {
      stateListeners.add(listener);
      return () => {
        stateListeners.delete(listener);
      };
    }

    function isHidden(snapshot, workspaceId) {
      return snapshot.hidden.indexOf(workspaceId) !== -1;
    }

    /** Persist + repaint a new snapshot. False means the write failed (quota). */
    function commitState(next) {
      let saved = true;
      try {
        window.localStorage.setItem(ICON_STORAGE_KEY, JSON.stringify(next.icons));
        window.localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(next.hidden));
      } catch (error) {
        saved = false;
      }
      state = next;
      applyProjectStyles();
      applyHiddenProjects();
      for (const listener of Array.from(stateListeners)) {
        try {
          listener();
        } catch (error) {
          /* A broken listener must not break persistence. */
        }
      }
      return saved;
    }

    function storeIcon(workspaceId, dataUrl) {
      const next = Object.assign({}, state.icons);
      next[workspaceId] = dataUrl;
      return commitState({ icons: next, hidden: state.hidden });
    }

    function deleteIcon(workspaceId) {
      if (!Object.prototype.hasOwnProperty.call(state.icons, workspaceId)) return true;
      const next = Object.assign({}, state.icons);
      delete next[workspaceId];
      return commitState({ icons: next, hidden: state.hidden });
    }

    function setProjectHidden(workspaceId, hidden) {
      const currentlyHidden = isHidden(state, workspaceId);
      if (currentlyHidden === hidden) return true;
      const nextHidden = hidden ? state.hidden.concat([workspaceId]) : state.hidden.filter((id) => id !== workspaceId);
      return commitState({ icons: state.icons, hidden: nextHidden });
    }

    function setHiddenProjects(nextHidden) {
      return commitState({ icons: state.icons, hidden: sanitizeHidden(nextHidden) });
    }

    /** Drop the stored icon/hidden state of a project that left the workspace list. */
    function forgetProject(workspaceId) {
      const nextIcons = Object.assign({}, state.icons);
      delete nextIcons[workspaceId];
      return commitState({ icons: nextIcons, hidden: state.hidden.filter((id) => id !== workspaceId) });
    }

    /** React hook over the store (subscribe/read, no external library). */
    function useProjectIconState() {
      const [snapshot, setSnapshot] = React.useState(getState);
      React.useEffect(() => {
        const unsubscribe = subscribeState(() => setSnapshot(getState()));
        setSnapshot(getState());
        return unsubscribe;
      }, []);
      return snapshot;
    }

    // ----------------------------------------------------------------- styles

    /** Chrome styles for the Settings page (colors are theme tokens only). */
    const UI_CSS = [
      '.dsh-pi-section{display:flex;flex-direction:column;width:100%;box-sizing:border-box;}',
      '.dsh-pi-head{padding:2px 0 10px;}',
      '.dsh-pi-title{margin:0;font-size:18px;line-height:24px;font-weight:600;color:var(--dsw-alias-label-primary);}',
      '.dsh-pi-desc{margin:6px 0 0;font-size:13px;line-height:19px;color:var(--dsw-alias-label-secondary);}',
      '.dsh-pi-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:.5px solid var(--dsw-alias-border-l2);border-bottom:.5px solid var(--dsw-alias-border-l2);}',
      '.dsh-pi-count{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary);}',
      '.dsh-pi-toolbar-actions{display:flex;align-items:center;gap:8px;flex:none;}',
      '.dsh-pi-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;}',
      '.dsh-pi-row{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:.5px solid var(--dsw-alias-border-l2);}',
      '.dsh-pi-row:last-child{border-bottom:none;}',
      '.dsh-pi-preview{width:44px;height:44px;flex:none;box-sizing:border-box;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);display:flex;align-items:center;justify-content:center;overflow:hidden;}',
      '.dsh-pi-preview img{display:block;width:100%;height:100%;object-fit:contain;}',
      '.dsh-pi-preview-empty{display:flex;color:var(--dsw-alias-label-tertiary);}',
      '.dsh-pi-meta{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0;}',
      '.dsh-pi-name{font-size:14px;line-height:20px;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dsh-pi-path{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dsh-pi-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;}',
      '.dsh-pi-state{display:inline-flex;font-size:11px;line-height:16px;padding:1px 7px;border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-tertiary);}',
      '.dsh-pi-state[data-active="true"]{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent);}',
      '.dsh-pi-badge{display:inline-flex;font-size:11px;line-height:16px;padding:1px 7px;border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-tertiary);}',
      '.dsh-pi-actions{display:flex;align-items:center;gap:8px;flex:none;}',
      '.dsh-pi-busy{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary);}',
      '.dsh-pi-links{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:3px;}',
      '.dsh-pi-link{appearance:none;border:0;border-radius:4px;background:none;padding:0;font:inherit;font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary);cursor:pointer;}',
      '.dsh-pi-link:hover:not(:disabled){color:var(--dsw-alias-label-primary);text-decoration:underline;}',
      '.dsh-pi-link:disabled{opacity:.45;cursor:default;}',
      '.dsh-pi-link:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}',
      '.dsh-pi-danger{color:var(--dsw-alias-state-error-primary);}',
      '.dsh-pi-sep{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary);}',
      '.dsh-pi-confirm{display:flex;flex-direction:column;gap:5px;margin-top:4px;padding:8px 10px;border-radius:8px;background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent);}',
      '.dsh-pi-confirm-text{font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary);}',
      '.dsh-pi-button{appearance:none;box-sizing:border-box;height:30px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:18px;cursor:pointer;}',
      '.dsh-pi-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));}',
      '.dsh-pi-button:disabled{opacity:.45;cursor:default;}',
      '.dsh-pi-button.dsh-pi-ghost{background:transparent;}',
      '.dsh-pi-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}',
      '.dsh-pi-iconbutton{appearance:none;box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;}',
      '.dsh-pi-iconbutton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));color:var(--dsw-alias-label-primary);}',
      '.dsh-pi-iconbutton[data-off="true"]{color:var(--dsw-alias-label-tertiary);}',
      '.dsh-pi-iconbutton:disabled{opacity:.45;cursor:default;}',
      '.dsh-pi-iconbutton:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}',
      '.dsh-pi-file{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}',
      '.dsh-pi-error{margin:0 0 12px;padding:8px 12px;border-radius:8px;font-size:13px;line-height:19px;color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);}',
      '.dsh-pi-empty{padding:22px 0;color:var(--dsw-alias-label-secondary);font-size:14px;line-height:20px;}',
      '.dsh-pi-empty strong{display:block;color:var(--dsw-alias-label-primary);margin-bottom:3px;}',
      '.dsh-pi-foot{margin:14px 0 0;font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary);}',
      'html[' + ROOT_FLAG + '="on"] [' + HIDDEN_ATTR + '="on"]{display:none !important;}',
    ].join('\n');

    /** Build the per-project sidebar icon rules from the current icon map. */
    function buildSidebarCss(map) {
      const lines = [];
      const ids = Object.keys(map);
      for (const id of ids) {
        const dataUrl = map[id];
        if (typeof dataUrl !== 'string' || dataUrl.indexOf('data:image/') !== 0) continue;
        const cell =
          'html[' + ROOT_FLAG + '="on"] [data-row-key=' + JSON.stringify(ROW_PREFIX + id) + '] span[class*="_folder"]';
        lines.push(cell + '{background-image:url("' + dataUrl + '");background-size:contain;background-position:center;background-repeat:no-repeat;}');
        lines.push(cell + ' > svg{display:none;}');
        lines.push(cell + ':not([class*="_folderActive"]){filter:grayscale(1);opacity:.45;}');
      }
      return lines.join('\n');
    }

    /** Create or refresh the one stylesheet this plugin owns. */
    function applyProjectStyles() {
      if (typeof document === 'undefined' || !document.head) return;
      let tag = null;
      try {
        tag = document.getElementById(STYLE_ID);
      } catch (error) {
        tag = null;
      }
      if (!tag) {
        tag = document.createElement('style');
        tag.id = STYLE_ID;
        document.head.appendChild(tag);
      }
      tag.textContent = UI_CSS + '\n' + buildSidebarCss(state.icons);
    }

    /** Mark the nearest shipped group section of every hidden project row. */
    function applyHiddenProjects() {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
      const hidden = state.hidden;
      if (hidden.length === 0) {
        const marked = document.querySelectorAll('[' + HIDDEN_ATTR + ']');
        for (let index = 0; index < marked.length; index += 1) marked[index].removeAttribute(HIDDEN_ATTR);
        return;
      }
      const rows = document.querySelectorAll('[data-row-key^="' + ROW_PREFIX + '"]');
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        if (!row || typeof row.getAttribute !== 'function') continue;
        const key = row.getAttribute('data-row-key');
        if (typeof key !== 'string' || key.indexOf(ROW_PREFIX) !== 0) continue;
        const id = key.slice(ROW_PREFIX.length);
        const shouldHide = id !== '' && hidden.indexOf(id) !== -1;
        const section = typeof row.closest === 'function' ? row.closest('[class*="_groupSection"]') : null;
        if (!section || typeof section.setAttribute !== 'function') continue;
        if (shouldHide) {
          if (section.getAttribute(HIDDEN_ATTR) !== 'on') section.setAttribute(HIDDEN_ATTR, 'on');
        } else if (section.getAttribute(HIDDEN_ATTR) === 'on') {
          section.removeAttribute(HIDDEN_ATTR);
        }
      }
    }

    // -------------------------------------------------------------- DOM reads

    /** One animation frame (or a timer fallback) for coalesced DOM scans. */
    function scheduleFrame(callback) {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(callback);
        return;
      }
      if (typeof window !== 'undefined' && window && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(callback);
        return;
      }
      setTimeout(callback, 16);
    }

    /** Re-apply the hidden marker whenever the shipped list re-renders rows. */
    function installHiddenObserver() {
      if (typeof document === 'undefined') return () => {};
      if (typeof MutationObserver !== 'function' || !document.body) return () => {};
      let target = document.body;
      try {
        const region = typeof document.querySelector === 'function' ? document.querySelector('[class*="_regionArea"]') : null;
        if (region) target = region;
      } catch (error) {
        target = document.body;
      }
      let scheduled = false;
      let stopped = false;
      const schedule = () => {
        if (scheduled || stopped) return;
        scheduled = true;
        scheduleFrame(() => {
          scheduled = false;
          if (!stopped) applyHiddenProjects();
        });
      };
      const observer = new MutationObserver(schedule);
      observer.observe(target, { childList: true, subtree: true });
      applyHiddenProjects();
      schedule();
      return () => {
        stopped = true;
        observer.disconnect();
      };
    }

    /** Read the project rows currently rendered by the shipped Workspace browser. */
    function scanWorkspacesFromDom() {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return [];
      const rows = document.querySelectorAll('[data-row-key^="' + ROW_PREFIX + '"]');
      const out = [];
      const seen = Object.create(null);
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        if (!row || typeof row.getAttribute !== 'function') continue;
        const key = row.getAttribute('data-row-key');
        if (typeof key !== 'string' || key.indexOf(ROW_PREFIX) !== 0) continue;
        const id = key.slice(ROW_PREFIX.length);
        if (id === '' || seen[id]) continue;
        seen[id] = true;
        let title = id;
        if (typeof row.querySelector === 'function') {
          const titleNode = row.querySelector('[class*="_title"]');
          const text = titleNode && typeof titleNode.textContent === 'string' ? titleNode.textContent.trim() : '';
          if (text !== '') title = text;
        }
        out.push({ workspaceId: id, title: title, path: '' });
      }
      return out;
    }

    /** Fallback feed for when the root `useWorkspaces` hook seat is absent. */
    function watchWorkspaceRows(onChange) {
      if (typeof document === 'undefined' || !document.body) return () => {};
      if (typeof MutationObserver !== 'function') return () => {};
      let scheduled = false;
      let stopped = false;
      const publish = () => {
        if (stopped) return;
        onChange(scanWorkspacesFromDom());
      };
      const schedule = () => {
        if (scheduled || stopped) return;
        scheduled = true;
        scheduleFrame(() => {
          scheduled = false;
          publish();
        });
      };
      const observer = new MutationObserver(schedule);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-row-key'] });
      schedule();
      return () => {
        stopped = true;
        observer.disconnect();
      };
    }

    /** Workspace owning the currently selected Session, from the shipped marker. */
    function findActiveWorkspaceId() {
      if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return null;
      const activeCell = document.querySelector('[data-row-key^="' + ROW_PREFIX + '"] [class*="_folderActive"]');
      if (!activeCell || typeof activeCell.closest !== 'function') return null;
      const row = activeCell.closest('[data-row-key^="' + ROW_PREFIX + '"]');
      if (!row || typeof row.getAttribute !== 'function') return null;
      const key = row.getAttribute('data-row-key');
      if (typeof key !== 'string' || key.indexOf(ROW_PREFIX) !== 0) return null;
      const id = key.slice(ROW_PREFIX.length);
      return id === '' ? null : id;
    }

    /** Live "which project is selected now" state for the Settings page. */
    function useActiveWorkspaceId() {
      const [activeId, setActiveId] = React.useState(findActiveWorkspaceId);
      React.useEffect(() => {
        if (typeof document === 'undefined' || !document.body) return undefined;
        if (typeof MutationObserver !== 'function') return undefined;
        let target = document.body;
        try {
          const region = typeof document.querySelector === 'function' ? document.querySelector('[class*="_regionArea"]') : null;
          if (region) target = region;
        } catch (error) {
          target = document.body;
        }
        let scheduled = false;
        let stopped = false;
        const publish = () => {
          if (!stopped) setActiveId(findActiveWorkspaceId());
        };
        const schedule = () => {
          if (scheduled || stopped) return;
          scheduled = true;
          scheduleFrame(() => {
            scheduled = false;
            publish();
          });
        };
        const observer = new MutationObserver(schedule);
        observer.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-row-key'] });
        schedule();
        return () => {
          stopped = true;
          observer.disconnect();
        };
      }, []);
      return activeId;
    }

    // ------------------------------------------------------------ image import

    function readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('decode'));
        reader.readAsDataURL(file);
      });
    }

    /** Center-fit the decoded image on a transparent square canvas. */
    function rasterizeDataUrl(dataUrl) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = ICON_SIZE;
            canvas.height = ICON_SIZE;
            const context = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
            if (!context) throw new Error('decode');
            const width = image.naturalWidth || image.width || ICON_SIZE;
            const height = image.naturalHeight || image.height || ICON_SIZE;
            const scale = Math.min(ICON_SIZE / width, ICON_SIZE / height);
            const targetWidth = Math.max(1, Math.round(width * scale));
            const targetHeight = Math.max(1, Math.round(height * scale));
            context.clearRect(0, 0, ICON_SIZE, ICON_SIZE);
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            context.drawImage(
              image,
              Math.round((ICON_SIZE - targetWidth) / 2),
              Math.round((ICON_SIZE - targetHeight) / 2),
              targetWidth,
              targetHeight,
            );
            resolve(canvas.toDataURL('image/png'));
          } catch (error) {
            reject(new Error('decode'));
          }
        };
        image.onerror = () => reject(new Error('decode'));
        image.src = dataUrl;
      });
    }

    /** Validate, read and normalize one picked file. */
    function fileToIconDataUrl(file) {
      if (!file || typeof file.type !== 'string' || file.type.indexOf('image/') !== 0) {
        return Promise.reject(new Error('not-image'));
      }
      if (typeof file.size === 'number' && file.size > MAX_FILE_BYTES) {
        return Promise.reject(new Error('too-large'));
      }
      return readFileAsDataUrl(file).then((dataUrl) => {
        if (typeof dataUrl !== 'string' || dataUrl.indexOf('data:image/') !== 0) throw new Error('not-image');
        return rasterizeDataUrl(dataUrl);
      });
    }

    /** Keep well-formed WorkspaceView items (or DOM fallback rows) only. */
    function normalizeWorkspaces(items) {
      const out = [];
      const seen = Object.create(null);
      if (!items || typeof items.length !== 'number') return out;
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        if (!item) continue;
        const workspaceId = typeof item.workspaceId === 'string' ? item.workspaceId : '';
        if (workspaceId === '' || seen[workspaceId]) continue;
        seen[workspaceId] = true;
        const title = typeof item.title === 'string' && item.title.trim() !== '' ? item.title.trim() : workspaceId;
        const path = typeof item.path === 'string' ? item.path : '';
        out.push({ workspaceId: workspaceId, title: title, path: path });
      }
      return out;
    }

    // ------------------------------------------------------------- components

    /** Small picture-frame placeholder shown until an icon is assigned. */
    function PlaceholderGlyph(props) {
      const size = props && typeof props.size === 'number' ? props.size : 20;
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: 'false',
        },
        h('rect', { x: 1.75, y: 2.5, width: 12.5, height: 11, rx: 2.25 }),
        h('circle', { cx: 5.6, cy: 6.2, r: 1.1, fill: 'currentColor', stroke: 'none', opacity: 0.8 }),
        h('path', { d: 'M3 12.2 6.1 9a1.05 1.05 0 0 1 1.55 0l2 2.2 1.2-1.3a1.05 1.05 0 0 1 1.55 0L13 11.2' }),
      );
    }

    /** Eye glyph shown for a project that is visible in the sidebar. */
    function EyeGlyph(props) {
      const size = props && typeof props.size === 'number' ? props.size : 16;
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: 'false',
        },
        h('path', { d: 'M1.4 8S3.9 3.9 8 3.9 14.6 8 14.6 8 12.1 12.1 8 12.1 1.4 8 1.4 8Z' }),
        h('circle', { cx: 8, cy: 8, r: 1.9 }),
      );
    }

    /** Struck-through eye glyph shown for a hidden project. */
    function EyeOffGlyph(props) {
      const size = props && typeof props.size === 'number' ? props.size : 16;
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: 'false',
        },
        h('path', { d: 'M2.4 2.4 13.6 13.6' }),
        h('path', { d: 'M6.4 6.4a2 2 0 0 0 2.8 2.8' }),
        h('path', { d: 'M4.3 4.6C2.7 5.8 1.4 8 1.4 8s2.5 4.1 6.6 4.1c1 0 1.9-.2 2.7-.7' }),
        h('path', { d: 'M10.1 4.1c.8.4 1.5.9 2.1 1.6C13.4 6.9 14.6 8 14.6 8s-.9 1.5-2.4 2.6' }),
      );
    }

    /** Current icon preview, or the placeholder. */
    function IconPreview(props) {
      const label = props && typeof props.label === 'string' ? props.label : '';
      const icon = props && typeof props.icon === 'string' ? props.icon : '';
      return h(
        'span',
        { className: 'dsh-pi-preview', role: 'img', 'aria-label': label },
        icon !== '' ? h('img', { src: icon, alt: '', draggable: false }) : h('span', { className: 'dsh-pi-preview-empty', 'aria-hidden': true }, h(PlaceholderGlyph, { size: 22 })),
      );
    }

    /** One project row inside the Settings page. */
    function ProjectIconRow(props) {
      const t = props.t;
      const item = props.item;
      const icon = props.icon;
      const hiddenNow = props.hidden === true;
      const locked = props.busy === true || props.pendingRemove === true || props.removing === true;
      const inputRef = React.useRef(null);
      const choose = () => {
        if (inputRef.current && typeof inputRef.current.click === 'function') inputRef.current.click();
      };
      const toggleLabel = hiddenNow ? t('toggle.show') : t('toggle.hide');
      const onFile = (event) => {
        const input = event && event.target;
        const file = input && input.files && input.files[0] ? input.files[0] : null;
        if (input) {
          try {
            input.value = '';
          } catch (error) {
            /* Some browsers refuse clearing a file input; the same file may then be ignored. */
          }
        }
        if (file) props.onFile(item, file);
      };
      const links = props.pendingRemove === true
        ? h(
            'span',
            { className: 'dsh-pi-confirm' },
            h('span', { className: 'dsh-pi-confirm-text' }, t('removeProject.note')),
            h(
              'span',
              { className: 'dsh-pi-links' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-pi-link dsh-pi-danger',
                  disabled: props.removing === true,
                  'aria-label': t('removeProject') + ': ' + item.title,
                  onClick: () => props.onConfirmRemove(item),
                },
                props.removing === true ? t('removing') : t('confirmRemove'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-pi-link',
                  disabled: props.removing === true,
                  onClick: () => props.onCancelRemove(item),
                },
                t('cancel'),
              ),
            ),
          )
        : h(
            'span',
            { className: 'dsh-pi-links' },
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-pi-link',
                disabled: locked || icon === '',
                onClick: () => props.onRemoveImage(item),
              },
              t('removeImage'),
            ),
            h('span', { className: 'dsh-pi-sep', 'aria-hidden': true }, '·'),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-pi-link dsh-pi-danger',
                disabled: locked,
                onClick: () => props.onRequestRemove(item),
              },
              t('removeProject'),
            ),
          );
      return h(
        'li',
        { className: 'dsh-pi-row', 'data-workspace-id': item.workspaceId, 'data-hidden': hiddenNow ? 'true' : 'false' },
        h(IconPreview, { icon: icon, label: t('preview') }),
        h(
          'span',
          { className: 'dsh-pi-meta' },
          h('span', { className: 'dsh-pi-name', title: item.title }, item.title),
          item.path !== '' ? h('span', { className: 'dsh-pi-path', dir: 'ltr', title: item.path }, item.path) : null,
          h(
            'span',
            { className: 'dsh-pi-chips' },
            h(
              'span',
              { className: 'dsh-pi-state', 'data-active': props.active ? 'true' : 'false' },
              props.active ? t('status.active') : t('status.idle'),
            ),
            hiddenNow ? h('span', { className: 'dsh-pi-badge' }, t('state.hidden')) : null,
          ),
          links,
        ),
        h(
          'span',
          { className: 'dsh-pi-actions' },
          props.busy ? h('span', { className: 'dsh-pi-busy' }, t('busy')) : null,
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-pi-iconbutton',
              'data-off': hiddenNow ? 'true' : 'false',
              'aria-pressed': hiddenNow ? 'false' : 'true',
              'aria-label': toggleLabel + ': ' + item.title,
              title: toggleLabel,
              disabled: locked,
              onClick: () => props.onToggleHidden(item),
            },
            h(hiddenNow ? EyeOffGlyph : EyeGlyph, { size: 16 }),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-pi-button',
              disabled: locked,
              'aria-label': t('choose') + ': ' + item.title,
              onClick: choose,
            },
            t('choose'),
          ),
          h('input', {
            ref: inputRef,
            className: 'dsh-pi-file',
            type: 'file',
            accept: 'image/*',
            onChange: onFile,
            tabIndex: -1,
            'aria-hidden': true,
          }),
        ),
      );
    }

    /** The Settings section content. */
    function ProjectIconsSection(props) {
      const t = resolveTranslate(props);
      const snapshot = useProjectIconState();
      const useWorkspacesHook = props && typeof props.useWorkspaces === 'function' ? props.useWorkspaces : null;
      const hookItems = useWorkspacesHook
        ? useWorkspacesHook((workspaceSnapshot) => (workspaceSnapshot && workspaceSnapshot.items ? workspaceSnapshot.items : null))
        : null;
      const [domWorkspaces, setDomWorkspaces] = React.useState(scanWorkspacesFromDom);
      React.useEffect(() => {
        if (useWorkspacesHook) return undefined;
        return watchWorkspaceRows(setDomWorkspaces);
      }, [useWorkspacesHook]);
      const workspaces = normalizeWorkspaces(hookItems !== null ? hookItems : domWorkspaces);
      const activeId = useActiveWorkspaceId();
      const [busyId, setBusyId] = React.useState(null);
      const [error, setError] = React.useState(null);
      const [pendingRemoveId, setPendingRemoveId] = React.useState(null);
      const [removingId, setRemovingId] = React.useState(null);

      let hiddenCount = 0;
      for (const item of workspaces) {
        if (isHidden(snapshot, item.workspaceId)) hiddenCount += 1;
      }
      const shownCount = workspaces.length - hiddenCount;

      const importFile = (item, file) => {
        setBusyId(item.workspaceId);
        setError(null);
        fileToIconDataUrl(file)
          .then((dataUrl) => {
            const saved = storeIcon(item.workspaceId, dataUrl);
            if (!saved) setError(t('error.save'));
          })
          .catch((reason) => {
            const code = reason && typeof reason.message === 'string' ? reason.message : 'decode';
            const key = code === 'not-image' ? 'error.notImage' : code === 'too-large' ? 'error.tooLarge' : 'error.decode';
            setError(t(key));
          })
          .finally(() => {
            setBusyId(null);
          });
      };

      const removeImage = (item) => {
        setError(null);
        const saved = deleteIcon(item.workspaceId);
        if (!saved) setError(t('error.save'));
      };

      const requestRemove = (item) => {
        setError(null);
        setPendingRemoveId(item.workspaceId);
      };

      const cancelRemove = () => {
        setPendingRemoveId(null);
      };

      const confirmRemove = (item) => {
        if (removingId !== null) return;
        setError(null);
        setRemovingId(item.workspaceId);
        requestWorkspaceRemoval(item.workspaceId)
          .then(() => {
            const saved = forgetProject(item.workspaceId);
            setPendingRemoveId(null);
            if (!saved) setError(t('error.save'));
          })
          .catch(() => {
            setError(t('error.remove'));
          })
          .finally(() => {
            setRemovingId(null);
          });
      };

      const toggleHidden = (item) => {
        setError(null);
        const saved = setProjectHidden(item.workspaceId, !isHidden(snapshot, item.workspaceId));
        if (!saved) setError(t('error.save'));
      };

      const showAll = () => {
        setError(null);
        const saved = setHiddenProjects([]);
        if (!saved) setError(t('error.save'));
      };

      const hideAll = () => {
        setError(null);
        const saved = setHiddenProjects(workspaces.map((item) => item.workspaceId));
        if (!saved) setError(t('error.save'));
      };

      return h(
        'div',
        { className: 'dsh-pi-section' },
        h(
          'div',
          { className: 'dsh-pi-head' },
          h('h3', { className: 'dsh-pi-title' }, t('section.title')),
          h('p', { className: 'dsh-pi-desc' }, t('section.description')),
        ),
        workspaces.length > 0
          ? h(
              'div',
              { className: 'dsh-pi-toolbar' },
              h('span', { className: 'dsh-pi-count' }, formatText(t('list.count'), { shown: shownCount, total: workspaces.length })),
              h(
                'span',
                { className: 'dsh-pi-toolbar-actions' },
                h(
                  'button',
                  { type: 'button', className: 'dsh-pi-button', disabled: hiddenCount === 0, onClick: showAll },
                  t('showAll'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-pi-button',
                    disabled: workspaces.length === 0 || hiddenCount === workspaces.length,
                    onClick: hideAll,
                  },
                  t('hideAll'),
                ),
              ),
            )
          : null,
        error !== null ? h('div', { className: 'dsh-pi-error', role: 'alert' }, error) : null,
        workspaces.length === 0
          ? h(
              'div',
              { className: 'dsh-pi-empty' },
              h('strong', null, t('empty.title')),
              h('span', null, t('empty.description')),
            )
          : h(
              'ul',
              { className: 'dsh-pi-list' },
              workspaces.map((item) =>
                h(ProjectIconRow, {
                  key: item.workspaceId,
                  item: item,
                  icon: snapshot.icons[item.workspaceId] ?? '',
                  active: activeId === item.workspaceId,
                  hidden: isHidden(snapshot, item.workspaceId),
                  busy: busyId === item.workspaceId,
                  pendingRemove: pendingRemoveId === item.workspaceId,
                  removing: removingId === item.workspaceId,
                  t: t,
                  onFile: importFile,
                  onRemoveImage: removeImage,
                  onToggleHidden: toggleHidden,
                  onRequestRemove: requestRemove,
                  onCancelRemove: cancelRemove,
                  onConfirmRemove: confirmRemove,
                }),
              ),
            ),
        h('p', { className: 'dsh-pi-foot' }, t('section.footnote')),
      );
    }

    /** Settings navigation glyph; the shell addresses it by the section id. */
    function ProjectIconsNavIcon(props) {
      const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 16;
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true, focusable: 'false' },
        h('rect', { x: 1.6, y: 2.4, width: 12.8, height: 11.2, rx: 2.4, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('circle', { cx: 5.7, cy: 6.2, r: 1.1, fill: 'currentColor', opacity: 0.85 }),
        h('path', {
          d: 'M3 12.2 6.1 9a1.05 1.05 0 0 1 1.55 0l2 2.2 1.2-1.3a1.05 1.05 0 0 1 1.55 0L13 11.2',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    // --------------------------------------------------------------- plugin

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const translate = ctx.locale.bind(NS);
        fallbackTranslate = (key) => {
          const text = translate(key);
          return typeof text === 'string' && text !== key ? text : EN[key] ?? key;
        };

        ctx.effect(() => ctx.locale.register(NS, 'en', EN), 'project icons: English dictionary');
        ctx.effect(() => ctx.locale.register(NS, 'ar', AR), 'project icons: Arabic dictionary');

        // Workspace-list removal resolves the controller at call time so this
        // plugin and ui-workspace may activate in either order.
        ctx.effect(() => {
          requestWorkspaceRemoval = (workspaceId) => {
            const service = ctx.get('workspaces');
            if (!service || typeof service.delete !== 'function') {
              return Promise.reject(new Error('workspace-service-unavailable'));
            }
            try {
              return Promise.resolve(service.delete(workspaceId));
            } catch (error) {
              return Promise.reject(error);
            }
          };
          return () => {
            requestWorkspaceRemoval = () => Promise.reject(new Error('workspace-service-unavailable'));
          };
        }, 'project icons: workspace-list removal');

        // Paint saved icons and hide saved projects before the Settings page is
        // ever opened; clear the whole effect on unload.
        ctx.effect(() => {
          if (typeof document === 'undefined') return undefined;
          document.documentElement.setAttribute(ROOT_FLAG, 'on');
          applyProjectStyles();
          applyHiddenProjects();
          const stopObserver = installHiddenObserver();
          return () => {
            stopObserver();
            document.documentElement.removeAttribute(ROOT_FLAG);
            const marked = document.querySelectorAll('[' + HIDDEN_ATTR + ']');
            for (let index = 0; index < marked.length; index += 1) marked[index].removeAttribute(HIDDEN_ATTR);
            const tag = document.getElementById(STYLE_ID);
            if (tag && tag.parentNode) tag.parentNode.removeChild(tag);
          };
        }, 'project icons: sidebar styles and visibility');

        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'project-icons',
              order: 27,
              label: () => fallbackTranslate('section.title'),
              locale: NS,
            },
            ProjectIconsSection,
          ),
        );

        ctx.slots.inject('settings.section.icon', () =>
          ctx.slots.register(
            {
              name: 'settings.section.icon',
              id: 'project-icons',
            },
            ProjectIconsNavIcon,
          ),
        );
      },
    };
  },
});

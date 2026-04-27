/* ===== COMPLAINTS LIST COMPONENT ===== */

const ComplaintsComponent = {
  filters: { search: '', status: '', level: '', priority: '', category: '' },

  render() {
    const container = document.getElementById('view-complaints');
    container.innerHTML = `
      <div class="animate-fade">
        <div class="table-wrapper">
          <div class="table-toolbar">
            <div class="search-box">
              <span class="search-icon">⌕</span>
              <input type="text" id="search-input" placeholder="Search by ID, title, customer..." value="${this.filters.search}"/>
            </div>
            <div class="filter-row">
              <select class="form-select" style="font-size:12px;padding:7px 10px;" id="filter-status">
                <option value="">All Status</option>
                ${STATUSES.map(s => `<option value="${s}" ${this.filters.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
              <select class="form-select" style="font-size:12px;padding:7px 10px;" id="filter-level">
                <option value="">All Levels</option>
                ${[1,2,3,4].map(l => `<option value="${l}" ${this.filters.level == l ? 'selected' : ''}>Level ${l}</option>`).join('')}
              </select>
              <select class="form-select" style="font-size:12px;padding:7px 10px;" id="filter-priority">
                <option value="">All Priority</option>
                ${PRIORITIES.map(p => `<option value="${p}" ${this.filters.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
              <button class="btn btn-ghost btn-sm" id="clear-filters">Clear</button>
            </div>
          </div>
          <div id="complaints-table-body"></div>
        </div>
      </div>
    `;

    this.renderTable();
    this.bindFilters();
  },

  getFiltered() {
    let data = AppData.getAll();
    const { search, status, level, priority } = this.filters;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.customer || '').toLowerCase().includes(q)
      );
    }
    if (status) data = data.filter(c => c.status === status);
    if (level) data = data.filter(c => c.level == level);
    if (priority) data = data.filter(c => c.priority === priority);
    return data;
  },

  renderTable() {
    const data = this.getFiltered();
    const body = document.getElementById('complaints-table-body');
    if (!body) return;

    if (data.length === 0) {
      body.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No complaints found</div><div class="empty-desc">Try adjusting your filters</div></div>`;
      return;
    }

    body.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Customer</th>
            <th>Category</th>
            <th>Level</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Timer</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(c => {
            const timer = Utils.timeUntilEscalation(c);
            const isActive = !['Resolved','Closed'].includes(c.status);
            return `
            <tr>
              <td><span class="text-mono" style="font-size:11px;color:var(--accent-primary);">${c.id}</span></td>
              <td style="max-width:160px;">
                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;color:var(--text-primary);" onclick="ModalComponent.showComplaint('${c.id}')" title="${Utils.escapeHtml(c.title)}">${Utils.escapeHtml(c.title)}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${c.category}</div>
              </td>
              <td style="font-size:12px;">${Utils.escapeHtml(c.customer || '—')}</td>
              <td style="font-size:12px;color:var(--text-secondary);">${c.category}</td>
              <td>
                <div style="display:flex;align-items:center;gap:6px;">
                  ${Utils.levelDot(c.level)}
                  <span style="font-family:var(--font-mono);font-size:11px;color:${Utils.levelColor(c.level)};">L${c.level}</span>
                </div>
              </td>
              <td><span style="font-size:12px;color:${Utils.priorityColor(c.priority)};">${c.priority}</span></td>
              <td>${Utils.statusBadge(c.status)}</td>
              <td>
                ${isActive && timer ? `
                  <div style="font-family:var(--font-mono);font-size:11px;color:${timer.overdue ? 'var(--accent-secondary)' : timer.pct > 80 ? 'var(--accent-orange)' : 'var(--text-secondary)'};" class="${timer.overdue ? 'animate-pulse' : ''}">
                    ${timer.overdue ? '⚠ ' : ''}${timer.label}
                    ${c.level < 4 ? '<div style="color:var(--text-muted);font-size:10px;">until L'+(c.level+1)+'</div>' : ''}
                  </div>
                ` : c.level >= 4 && isActive ? `<span style="font-size:11px;color:var(--accent-secondary);">Max Level</span>` : '<span style="color:var(--text-muted);font-size:11px;">—</span>'}
              </td>
              <td style="font-size:11px;color:var(--text-muted);">${Utils.timeAgo(c.createdAt)}</td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn btn-ghost btn-sm" onclick="ModalComponent.showComplaint('${c.id}')">View</button>
                  ${isActive ? `<button class="btn btn-sm" style="background:rgba(71,255,160,0.1);color:var(--accent-green);border:1px solid rgba(71,255,160,0.2);" onclick="ComplaintsComponent.resolveComplaint('${c.id}')">Resolve</button>` : ''}
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="padding:12px 16px;border-top:1px solid var(--border-color);font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">${data.length} complaint${data.length !== 1 ? 's' : ''} found</div>
    `;
  },

  bindFilters() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(e => {
        this.filters.search = e.target.value;
        this.renderTable();
      }, 250));
    }

    ['status','level','priority'].forEach(f => {
      const el = document.getElementById(`filter-${f}`);
      if (el) el.addEventListener('change', e => { this.filters[f] = e.target.value; this.renderTable(); });
    });

    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.filters = { search: '', status: '', level: '', priority: '', category: '' };
        this.render();
      });
    }
  },

  resolveComplaint(id) {
    const note = prompt('Resolution note (optional):');
    if (note === null) return;
    AppData.resolve(id, note);
    Toast.show('✓ Complaint marked as Resolved', 'success');
    SidebarComponent.updateEscalationBadge();
    this.renderTable();
  }
};

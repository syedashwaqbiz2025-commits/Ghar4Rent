document.addEventListener('DOMContentLoaded', () => {
    // Initial render
    filterRentCards();

    // Add event listeners to filters
    document.getElementById('rentTypeFilter').addEventListener('change', filterRentCards);
    document.getElementById('rentBedroomFilter').addEventListener('change', filterRentCards);
    document.getElementById('rentFurnishingFilter').addEventListener('change', filterRentCards);
    document.getElementById('rentLocationFilter').addEventListener('input', filterRentCards);
    document.getElementById('rentMinPrice').addEventListener('change', filterRentCards);
    document.getElementById('rentMaxPrice').addEventListener('change', filterRentCards);

    // Location dropdown behavior: floating searchable panel (matches buy.html UX)
    const dropdownToggle = document.getElementById('rentDropdownToggle');
    const hiddenLocationInput = document.getElementById('rentLocationFilter');
    if (dropdownToggle && hiddenLocationInput) {
        // build hyderabad locations list from properties + fallback
        const fromProps = properties.map(p => (p.location || '').toString()).filter(s => /hyderabad/i.test(s));
        const fallback = ['Banjara Hills','Jubilee Hills','Hitech City','Madhapur','Kondapur','Gachibowli','Secunderabad','Begumpet','Malkajgiri','Kukatpally','Nampally','Ameerpet','LB Nagar','Dilsukhnagar','Charminar','Tolichowki','Manikonda','Miyapur','Mehdipatnam','Kachiguda','Santosh Nagar'];
        const set = new Set();
        fromProps.forEach(s => set.add(s));
        fallback.forEach(s => set.add(s));
        const hyderabadLocations = Array.from(set).sort();

        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            // avoid duplicate panels
            let panel = document.getElementById('floatingRentPanel');
            if (panel) { panel.remove(); dropdownToggle.classList.remove('open'); return; }
            panel = document.createElement('div');
            panel.id = 'floatingRentPanel';
            panel.className = 'floating-dropdown-panel';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Search Hyderabad locations...';
            panel.appendChild(input);
            const listWrap = document.createElement('div');
            listWrap.style.maxHeight = '260px'; listWrap.style.overflow = 'auto';
            panel.appendChild(listWrap);
            document.body.appendChild(panel);
            const rect = dropdownToggle.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const preferBelow = spaceBelow > 260 + 20 || spaceBelow > spaceAbove;
            const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            const desiredWidth = Math.max(260, rect.width);
            const extra = 20;
            let panelWidth = desiredWidth + extra;
            const section = dropdownToggle.closest('section');
            if (section) {
                const srect = section.getBoundingClientRect();
                panelWidth = Math.min(panelWidth, srect.width - 24, viewportWidth - 24);
            } else {
                panelWidth = Math.min(panelWidth, viewportWidth - 24);
            }
            let left = rect.left;
            if (section) {
                const srect = section.getBoundingClientRect();
                const sectionLeft = srect.left + window.scrollX;
                const sectionRight = sectionLeft + srect.width;
                if (left + panelWidth > sectionRight - 12) left = Math.max(sectionLeft + 12, sectionRight - panelWidth - 12);
                if (left < sectionLeft + 12) left = sectionLeft + 12;
            } else {
                if (left + panelWidth > viewportWidth - 12) left = Math.max(12, viewportWidth - panelWidth - 12);
            }
            // use fixed positioning so the panel is anchored to viewport (not to document flow)
            panel.style.position = 'fixed';
            panel.style.left = `${left}px`;
            panel.style.top = preferBelow ? `${rect.bottom + 6}px` : `${rect.top - 6}px`;
                panel.style.width = panelWidth + 'px';

            const render = (items) => {
                listWrap.innerHTML = '';
                if (!items || items.length === 0) { const empty = document.createElement('div'); empty.className='floating-dropdown-item no-results'; empty.textContent='No locations'; listWrap.appendChild(empty); return; }
                items.forEach(loc => {
                    const it = document.createElement('div'); it.className='floating-dropdown-item'; it.textContent = loc;
                    it.onclick = () => { hiddenLocationInput.value = loc; document.getElementById('rentDropdownLabel').textContent = loc; panel.remove(); dropdownToggle.classList.remove('open'); filterRentCards(); };
                    listWrap.appendChild(it);
                });
            };
            render(hyderabadLocations);
            input.addEventListener('input', () => { const q = input.value.trim().toLowerCase(); render(q ? hyderabadLocations.filter(h=>h.toLowerCase().includes(q)) : hyderabadLocations); });
            if (!preferBelow) {
                panel.classList.add('open-up');
                setTimeout(()=>{ const ph = panel.getBoundingClientRect().height; panel.style.top = (rect.top - ph - 6) + 'px'; }, 0);
            }
            dropdownToggle.classList.add('open');
            const closeFn = (ev) => { if (!panel.contains(ev.target) && !dropdownToggle.contains(ev.target)) { panel.remove(); dropdownToggle.classList.remove('open'); document.removeEventListener('click', closeFn); } };
            setTimeout(()=>document.addEventListener('click', closeFn),0);
            setTimeout(()=>input.focus(),30);
        });
    }
});

function filterRentCards() {
    const rentProperties = properties.filter(p => p.status === 'rent');

    const type = document.getElementById('rentTypeFilter').value;
    const bedroom = document.getElementById('rentBedroomFilter').value;
    const furnishing = document.getElementById('rentFurnishingFilter').value;
    const location = document.getElementById('rentLocationFilter').value;
    const minPrice = parseInt(document.getElementById('rentMinPrice').value);
    const maxPrice = parseInt(document.getElementById('rentMaxPrice').value);

    let filtered = rentProperties.filter(p => {
        const matchesType = type === 'all' || p.type === type;
        const matchesBedroom = bedroom === 'all' || p.bedrooms === bedroom;
        const matchesFurnishing = furnishing === 'all' || p.furnishing === furnishing;
        const matchesLocation = location === 'all' || p.location.includes(location);
        const matchesMinPrice = isNaN(minPrice) || p.price >= minPrice;
        const matchesMaxPrice = isNaN(maxPrice) || p.price <= maxPrice;
        return matchesType && matchesBedroom && matchesFurnishing && matchesLocation && matchesMinPrice && matchesMaxPrice;
    });

    renderRentCards(filtered);
}

function renderRentCards(list) {
    const container = document.getElementById('rentPropertyList');
    container.innerHTML = '';

    // Update filter summary above the cards
    const summaryDiv = document.getElementById('rentFilterSummary');
    summaryDiv.innerHTML = `<strong>Showing ${list.length} properties</strong>`;

    if (list.length === 0) {
        container.innerHTML = '<p class="no-results">No properties found. Try changing your filters.</p>';
        return;
    }

    list.forEach(prop => {
        const card = document.createElement('div');
        card.className = 'property-card';
        card.innerHTML = `<img src='${prop.img}' alt='${prop.title}' class='property-img'><h3>${prop.title}</h3><p class='location'>${prop.location}</p><p class='price'>₹${prop.price.toLocaleString()}/month</p><p>${prop.details}</p>`;
        container.appendChild(card);
    });
}
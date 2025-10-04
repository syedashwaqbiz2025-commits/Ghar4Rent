document.addEventListener('DOMContentLoaded', () => {
    // Initial render
    filterBuyCards();

    // Add event listeners to filters
    document.getElementById('buyTypeFilter').addEventListener('change', filterBuyCards);
    document.getElementById('buyBedroomFilter').addEventListener('change', filterBuyCards);
    document.getElementById('buyFurnishingFilter').addEventListener('change', filterBuyCards);
    document.getElementById('buyLocationFilter').addEventListener('input', filterBuyCards);
    document.getElementById('buyMinPrice').addEventListener('change', filterBuyCards);
    document.getElementById('buyMaxPrice').addEventListener('change', filterBuyCards);

    // Replace location input with a searchable Hyderabad dropdown.
    // Elements from the new dropdown in buy.html
    const dropdown = document.getElementById('locationDropdown');
    const dropdownToggle = document.getElementById('dropdownToggle');
    const dropdownPanel = document.getElementById('dropdownPanel');
    const dropdownSearch = document.getElementById('dropdownSearch');
    const dropdownList = document.getElementById('dropdownList');
    const hiddenLocationInput = document.getElementById('buyLocationFilter');

    // Server-side Places proxy configuration (kept for potential place-details fetches)
    const PLACES_PROXY_ENABLED = true;
    const PLACES_PROXY_URL = window.PLACES_PROXY_URL || '/api/places/autocomplete';

    if (dropdown && dropdownList) {
        // derive candidate location names from properties; prefer more specific locality parts
        const allNames = properties.map(p => (p.location || '').toString()).filter(Boolean);
        // attempt to pick Hyderabad locations (if property strings mention Hyderabad)
        const fromProps = allNames
            .filter(s => /hyderabad/i.test(s))
            .map(s => s.split(',').map(x => x.trim()).filter(Boolean).join(', '));

        // fallback curated list of Hyderabad localities
        const fallbackHyderabad = ['Banjara Hills','Jubilee Hills','Hitech City','Madhapur','Kondapur','Gachibowli','Secunderabad','Begumpet','Malkajgiri','Kukatpally','Nampally','Ameerpet','LB Nagar','Dilsukhnagar','Charminar','Tolichowki','Manikonda','Miyapur','Mehdipatnam','Kachiguda','Santosh Nagar'];

        const hyderabadSet = new Set();
        fromProps.forEach(s => hyderabadSet.add(s));
        fallbackHyderabad.forEach(s => hyderabadSet.add(s));
        const hyderabadLocations = Array.from(hyderabadSet).sort();

        const renderDropdownList = (items) => {
            dropdownList.innerHTML = '';
            if (!items || items.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'dropdown-item no-results';
                empty.textContent = 'No locations';
                dropdownList.appendChild(empty);
                return;
            }
            items.forEach(loc => {
                const it = document.createElement('div');
                it.className = 'dropdown-item';
                it.textContent = loc;
                it.onclick = async () => {
                    // set hidden input used by existing filter logic
                    hiddenLocationInput.value = loc;
                    // update visible label
                    const label = document.getElementById('dropdownLabel');
                    if (label) label.textContent = loc;
                    // close panel
                    dropdownPanel.style.display = 'none';
                    // clear any selected place (unless you want to call place-details here)
                    window._selectedPlace = null;
                    // trigger filtering
                    filterBuyCards();
                };
                dropdownList.appendChild(it);
            });
        };

        // initial render
        renderDropdownList(hyderabadLocations);

        // toggle panel: we will display a floating panel appended to body to avoid clipping
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            // size the toggle to match other filters
            const sampleSelect = document.querySelector('.filters select');
            if (sampleSelect) {
                const cs = window.getComputedStyle(sampleSelect);
                dropdownToggle.style.minHeight = cs.height || '40px';
                dropdownToggle.style.fontSize = cs.fontSize || '15px';
                dropdownToggle.style.padding = cs.padding || '8px 12px';
            }

            // render floating panel near the toggle so the panel is not clipped by parent
            let panel = document.getElementById('floatingLocationPanel');
            if (panel) {
                // toggle visibility
                panel.remove();
                dropdownToggle.classList.remove('open');
                return;
            }
            panel = document.createElement('div');
            panel.id = 'floatingLocationPanel';
            panel.className = 'floating-dropdown-panel';
            // build inner html: search input + list
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Search Hyderabad locations...';
            input.style.marginBottom = '8px';
            panel.appendChild(input);
            const listWrap = document.createElement('div');
            listWrap.className = 'floating-dropdown-list';
            listWrap.style.maxHeight = '260px';
            listWrap.style.overflow = 'auto';
            panel.appendChild(listWrap);
            document.body.appendChild(panel);

            // position panel near the toggle (prefer below, flip above if not enough space)
            const rect = dropdownToggle.getBoundingClientRect();
            const leftRaw = rect.left + window.scrollX;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const preferBelow = spaceBelow > 260 + 20 || spaceBelow > spaceAbove;
            const top = preferBelow ? rect.bottom + window.scrollY + 6 : rect.top + window.scrollY - 6;
            // clamp horizontally to the parent section (if available) or viewport so panel doesn't overflow
            const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            const desiredWidth = Math.max(260, rect.width);
            const extra = 20; // make floating panel slightly wider than toggle (reduced)
            let panelWidth = desiredWidth + extra;
            // prefer clamping to section content if present
            const section = dropdownToggle.closest('section');
            if (section) {
                const srect = section.getBoundingClientRect();
                const maxForSection = srect.width - 24; // leave small gutter
                panelWidth = Math.min(panelWidth, maxForSection, viewportWidth - 24);
            } else {
                panelWidth = Math.min(panelWidth, viewportWidth - 24);
            }
            let left = leftRaw;
            // ensure panel stays within section (if present) or viewport
            if (section) {
                const srect = section.getBoundingClientRect();
                const sectionLeft = srect.left + window.scrollX;
                const sectionRight = sectionLeft + srect.width;
                if (left + panelWidth > sectionRight - 12) left = Math.max(sectionLeft + 12, sectionRight - panelWidth - 12);
                if (left < sectionLeft + 12) left = sectionLeft + 12;
            } else {
                if (left + panelWidth > viewportWidth - 12) left = Math.max(12, viewportWidth - panelWidth - 12);
            }
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
            panel.style.width = panelWidth + 'px';

            // render initial list
            const renderFloating = (items) => {
                listWrap.innerHTML = '';
                if (!items || items.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'floating-dropdown-item no-results';
                    empty.textContent = 'No locations';
                    listWrap.appendChild(empty);
                    return;
                }
                items.forEach(loc => {
                    const it = document.createElement('div');
                    it.className = 'floating-dropdown-item';
                    it.textContent = loc;
                    it.onclick = () => {
                        hiddenLocationInput.value = loc;
                        const label = document.getElementById('dropdownLabel');
                        if (label) label.textContent = loc;
                        panel.remove();
                        dropdownToggle.classList.remove('open');
                        window._selectedPlace = null;
                        filterBuyCards();
                    };
                    listWrap.appendChild(it);
                });
            };
            renderFloating(hyderabadLocations);

            // wire search inside floating panel
            input.addEventListener('input', () => {
                const q = input.value.trim().toLowerCase();
                if (!q) return renderFloating(hyderabadLocations);
                renderFloating(hyderabadLocations.filter(h => h.toLowerCase().includes(q)));
            });

            // if opening upward, adjust position after DOM insertion
            if (!preferBelow) {
                panel.classList.add('open-up');
                setTimeout(() => {
                    const ph = panel.getBoundingClientRect().height;
                    panel.style.top = (rect.top - ph - 6) + 'px';
                }, 0);
            }
            dropdownToggle.classList.add('open');

            // close when clicking outside
            const closeFn = (ev) => {
                if (!panel.contains(ev.target) && !dropdownToggle.contains(ev.target)) {
                    panel.remove();
                    dropdownToggle.classList.remove('open');
                    document.removeEventListener('click', closeFn);
                }
            };
            setTimeout(() => document.addEventListener('click', closeFn), 0);
            // auto focus search
            setTimeout(() => input.focus(), 30);
        });

        // search inside dropdown
        dropdownSearch.addEventListener('input', () => {
            const q = dropdownSearch.value.trim().toLowerCase();
            if (!q) {
                renderDropdownList(hyderabadLocations);
                return;
            }
            const filtered = hyderabadLocations.filter(h => h.toLowerCase().includes(q));
            renderDropdownList(filtered);
        });

        // close when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdownPanel.style.display = 'none';
            }
        });
    }
});

function filterBuyCards() {
    const buyProperties = properties.filter(p => p.status === 'buy');

    const type = document.getElementById('buyTypeFilter').value;
    const bedroom = document.getElementById('buyBedroomFilter').value;
    const furnishing = document.getElementById('buyFurnishingFilter').value;
    const location = document.getElementById('buyLocationFilter').value;
    const minPrice = parseInt(document.getElementById('buyMinPrice').value);
    const maxPrice = parseInt(document.getElementById('buyMaxPrice').value);

    let filtered = buyProperties.filter(p => {
        const matchesType = type === 'all' || p.type === type;
        const matchesBedroom = bedroom === 'all' || p.bedrooms === bedroom;
        const matchesFurnishing = furnishing === 'all' || p.furnishing === furnishing;
        const matchesLocation = location === 'all' || p.location.includes(location);
        const matchesMinPrice = isNaN(minPrice) || p.price >= minPrice;
        const matchesMaxPrice = isNaN(maxPrice) || p.price <= maxPrice;
        return matchesType && matchesBedroom && matchesFurnishing && matchesLocation && matchesMinPrice && matchesMaxPrice;
    });

    // Distance/radius filtering removed — selection of geo-radius is not used

    renderBuyCards(filtered);
}

// Haversine distance in km
function haversineDistance(lat1, lon1, lat2, lon2) {
    function toRad(x) { return x * Math.PI / 180; }
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function renderBuyCards(list) {
    const container = document.getElementById('buyPropertyList');
    container.innerHTML = '';

    // Update the existing summary element (matches rent.html behavior)
    const summaryEl = document.getElementById('buyFilterSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `<strong>Showing ${list.length} properties</strong>`;
    }

    if (list.length === 0) {
        const noResults = document.createElement('p');
        noResults.className = 'no-results';
        noResults.textContent = 'No properties found. Try changing your filters.';
        container.appendChild(noResults);
        return;
    }

    list.forEach(prop => {
        const card = document.createElement('div');
        card.className = 'property-card';
        card.innerHTML = `<img src='${prop.img}' alt='${prop.title}' class='property-img'><h3>${prop.title}</h3><p class='location'>${prop.location}</p><p class='price'>₹${(prop.price/100000).toFixed(2)} Lakh</p><p>${prop.details}</p>`;
        container.appendChild(card);
    });
}
document.addEventListener('DOMContentLoaded', () => {
    // Initial render
    filterCommercialCards();

    // Add event listeners to filters
    document.getElementById('commercialBuyRentFilter').addEventListener('change', filterCommercialCards);
    document.getElementById('commercialTypeFilter').addEventListener('change', filterCommercialCards);
    document.getElementById('commercialAreaFilter').addEventListener('change', filterCommercialCards);
    document.getElementById('commercialFurnishingFilter').addEventListener('change', filterCommercialCards);
    document.getElementById('commercialLocationFilter').addEventListener('input', filterCommercialCards);
    document.getElementById('commercialMinPrice').addEventListener('change', filterCommercialCards);
    document.getElementById('commercialMaxPrice').addEventListener('change', filterCommercialCards);

    // Fix location dropdown behavior
    const dropdownToggle = document.getElementById('commercialDropdownToggle');
    const hiddenLocationInput = document.getElementById('commercialLocationFilter');
    const dropdownPanel = document.getElementById('commercialDropdownPanel');
    const dropdownSearch = document.getElementById('commercialDropdownSearch');
    const dropdownList = document.getElementById('commercialDropdownList');

    if (dropdownToggle && hiddenLocationInput && dropdownPanel && dropdownSearch && dropdownList) {
        const hyderabadLocations = [
            'Banjara Hills', 'Jubilee Hills', 'Hitech City', 'Madhapur', 'Kondapur', 'Gachibowli',
            'Secunderabad', 'Begumpet', 'Malkajgiri', 'Kukatpally', 'Nampally', 'Ameerpet',
            'LB Nagar', 'Dilsukhnagar', 'Charminar', 'Tolichowki', 'Manikonda', 'Miyapur',
            'Mehdipatnam', 'Kachiguda', 'Santosh Nagar'
        ];

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
                it.onclick = () => {
                    hiddenLocationInput.value = loc;
                    const label = document.getElementById('commercialDropdownLabel');
                    if (label) label.textContent = loc;
                    dropdownPanel.style.display = 'none';
                    filterCommercialCards();
                };
                dropdownList.appendChild(it);
            });
        };

        dropdownToggle.addEventListener('click', () => {
            dropdownPanel.style.display = dropdownPanel.style.display === 'block' ? 'none' : 'block';
            renderDropdownList(hyderabadLocations);
        });

        dropdownSearch.addEventListener('input', () => {
            const query = dropdownSearch.value.trim().toLowerCase();
            const filteredLocations = hyderabadLocations.filter(loc => loc.toLowerCase().includes(query));
            renderDropdownList(filteredLocations);
        });

        document.addEventListener('click', (e) => {
            if (!dropdownPanel.contains(e.target) && !dropdownToggle.contains(e.target)) {
                dropdownPanel.style.display = 'none';
            }
        });
    }
});

function filterCommercialCards() {
    const commercialProperties = properties.filter(p => p.category === 'commercial');

    const buyRent = document.getElementById('commercialBuyRentFilter').value;
    const type = document.getElementById('commercialTypeFilter').value;
    const furnishing = document.getElementById('commercialFurnishingFilter').value;
    const location = document.getElementById('commercialLocationFilter').value;
    const minPrice = parseInt(document.getElementById('commercialMinPrice').value);
    const maxPrice = parseInt(document.getElementById('commercialMaxPrice').value);

    let filtered = commercialProperties.filter(p => {
        const matchesBuyRent = buyRent === 'all' || p.status === buyRent;
        const matchesType = type === 'all' || p.type === type;
        const matchesFurnishing = furnishing === 'all' || p.furnishing === furnishing;
        const matchesLocation = location === 'all' || p.location.includes(location);
        const matchesMinPrice = isNaN(minPrice) || p.price >= minPrice;
        const matchesMaxPrice = isNaN(maxPrice) || p.price <= maxPrice;
        return matchesBuyRent && matchesType && matchesFurnishing && matchesLocation && matchesMinPrice && matchesMaxPrice;
    });

    // Update the summary count
    const summaryElement = document.getElementById('commercialCount');
    if (summaryElement) {
        summaryElement.textContent = filtered.length;
    }

    renderCommercialCards(filtered);
}

function renderCommercialCards(list) {
    const container = document.getElementById('commercialPropertyList');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML += '<p class="no-results">No properties found. Try changing your filters.</p>';
        return;
    }

    list.forEach(prop => {
        const card = document.createElement('div');
        card.className = 'property-card';
        card.innerHTML = `<a href="property-details.html?id=${prop.id}"><img src='${prop.img}' alt='${prop.title}' class='property-img'><h3>${prop.title}</h3><p class='location'>${prop.location}</p><p class='price'>₹${prop.price.toLocaleString()}/month</p><p>${prop.details}</p></a>`;
        container.appendChild(card);
    });
}
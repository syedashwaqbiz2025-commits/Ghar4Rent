document.addEventListener('DOMContentLoaded', () => {
    const propertyDetailContainer = document.getElementById('propertyDetail');
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = parseInt(urlParams.get('id'));

    const property = properties.find(p => p.id === propertyId);

    if (property) {
        propertyDetailContainer.innerHTML = `
            <h2>${property.title}</h2>
            <div class="gallery">
                <img src="${property.img}" alt="Property Image 1">
            </div>
            <p><strong>Location:</strong> ${property.location}</p>
            <p><strong>Type:</strong> ${property.status === 'rent' ? 'For Rent' : 'For Purchase'}</p>
            <p><strong>Price:</strong> ${property.price}</p>
            <p><strong>Details:</strong> ${property.details}</p>
            <div class="map">
                <iframe src="https://www.google.com/maps?q=${property.location}&output=embed" width="100%" height="250" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
            </div>
            <form class="inquiry-form">
                <h3>Send Inquiry</h3>
                <input type="text" placeholder="Your Name" required>
                <input type="email" placeholder="Your Email" required>
                <textarea placeholder="Your Message" required></textarea>
                <button type="submit">Send</button>
            </form>
        `;
    } else {
        propertyDetailContainer.innerHTML = '<p>Property not found.</p>';
    }
});
 async function loadRecommendations() {

    const response = await fetch("data/ram.json");

    const recommendations = await response.json();

    const container = document.getElementById("recommendationCards");

    recommendations.forEach(item => {

        const card = document.createElement("article");

        card.className = "card";

        card.innerHTML = `

            <h2>${item.category}</h2>

            <h3>${item.brand} ${item.model}</h3>

            <p>${item.capacity}</p>

            <p>${item.speed}</p>

            <p><strong>$${item.price}</strong></p>

            <p>${item.store}</p>

            <p>Verified: ${item.verified}</p>

            <p><strong>Hardware Radar Score:</strong> ${item.score}</p>

            <ul>

                ${item.reasons.map(reason => `<li>✓ ${reason}</li>`).join("")}

            </ul>

            <button>View Deal</button>

        `;

        container.appendChild(card);

    });

}

loadRecommendations();
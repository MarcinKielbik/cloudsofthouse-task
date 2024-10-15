// Zmienne globalne
let offersData = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// Funkcja formatowania daty na "miesiąc rok"
function formatDate(pdd) {
  if (!pdd || pdd === "0000-00-00") return null;
  const date = new Date(pdd);
  const monthsPolish = [
    "styczeń",
    "luty",
    "marzec",
    "kwiecień",
    "maj",
    "czerwiec",
    "lipiec",
    "sierpień",
    "wrzesień",
    "październik",
    "listopad",
    "grudzień",
  ];
  const month = monthsPolish[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}*`;
}

// Pobieranie danych JSON
fetch("https://gx.pandora.caps.pl/zadania/api/offers2023.json")
  .then((response) => response.json())
  .then((data) => {
    if (Array.isArray(data.offers)) {
      offersData = data.offers; // Zapisanie ofert globalnie
      generateCityOptions(offersData); // Generowanie opcji miast
      displayOffers(offersData); // Wyświetlenie ofert
      handleFiltersAndSorting(offersData); // Obsługa filtrowania i sortowania
    } else {
      console.error('Błąd: "offers" nie jest tablicą');
    }
  })
  .catch((error) => console.error("Błąd pobierania danych:", error));

// Funkcja generująca opcje miast
function generateCityOptions(offers) {
  const cityFilter = document.getElementById("city-filter");
  const cities = [...new Set(offers.map((offer) => offer.miasto))]; // Usuwanie duplikatów
  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    cityFilter.appendChild(option);
  });
}

// Funkcja wyświetlająca oferty
function displayOffers(offers) {
  const offersContainer = document.getElementById("offers-container");
  offersContainer.innerHTML = "";

  offers.forEach((offer) => {
    const offerElement = document.createElement("div");
    offerElement.classList.add("col-lg-3", "col-md-6", "col-sm-12", "mb-4");

    // Sprawdzenie dostępności
    let availabilityText = offer.in_stock
      ? "Dostępny od ręki!"
      : `Przewidywana dostawa: ${formatDate(offer.pdd)}`;

    // Sprawdzenie, czy oferta jest w ulubionych
    const isFavorite = favorites.includes(offer.id_angebot) ? "fas" : "far";

    offerElement.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <i class="${isFavorite} fa-heart favorite-icon" data-id="${offer.id_angebot}" style="color:#ffffff; cursor:pointer;position: absolute; top: 18px; right: 15px;"></i>
          
          <h1 class="card-title mt-4">${offer.model}</h5>

          <small class="card-text text-white">${availabilityText}</small>
          <img src="${offer.offer_details.image_paths.front}" alt="${offer.model}" class="img-fluid mb-2">
          

          <p class="card-text d-flex justify-content-between">
            <span class="small"  style="align-self: flex-end;">Rok produkcji:</span> 
            <span class="fw-bold fs-6">${offer.pyear}</span>
          </p>

          <p class="card-text d-flex justify-content-between">
            <span class="small">Miasto:</span> 
            <span class="fw-bold fs-6">${offer.miasto}</span>
          </p>

      <div class="mt-2">
        <p class="card-text d-flex justify-content-between align-items-end">
          <span class="small" style="align-self: flex-end;">Cena netto:</span> 
          <span><span class="fw-bold fs-4">${offer.car_price_disc.toLocaleString("pl-PL")}</span> zł</span>
        </p>

        <p class="card-text d-flex justify-content-between">

        <span class="small">Cena brutto:</span> 
        <span><span class="fw-bold fs-6">${offer.total_gross_price.toLocaleString("pl-PL")}</span> zł</span>
      </p>
      </div>
      
           <button>ZOBACZ OFERTĘ</button>
        </div>
      </div>
    `;

    offersContainer.appendChild(offerElement);
  });

  // Dodanie event listenerów dla wszystkich serduszek
  document.querySelectorAll(".favorite-icon").forEach((icon) => {
    icon.addEventListener("click", toggleFavorite);
  });
}

// Funkcja dodająca/usuwająca ofertę z ulubionych
function toggleFavorite(event) {
  const offerId = Number(event.target.getAttribute("data-id")); // Konwersja na liczbę
  const index = favorites.indexOf(offerId);

  if (index > -1) {
    // Usunięcie z ulubionych
    favorites.splice(index, 1);
  } else {
    // Dodanie do ulubionych
    favorites.push(offerId);
  }

  // Zapisz ulubione w LocalStorage
  localStorage.setItem("favorites", JSON.stringify(favorites));

  // Zaktualizowanie widoku z nowymi danymi
  displayOffers(offersData); // Używamy globalnej zmiennej offersData
}

// Funkcja obsługująca filtrowanie i sortowanie ofert
function handleFiltersAndSorting(offers) {
  const cityFilter = document.getElementById("city-filter");
  const transmissionFilter = document.getElementById("automatic");
  const stockFilter = document.getElementById("available");
  const sortPrice = document.getElementById("sort-price");
  const searchInput = document.querySelector(".search-input");
  const favoritesFilter = document.getElementById("favorites-filter"); // Dodaj obsługę checkboxa ulubionych

  function applyFilters() {
    const selectedCity = cityFilter.value;
    const isAutomatic = transmissionFilter.checked;
    const inStock = stockFilter.checked;
    const searchTerm = searchInput.value.toLowerCase();
    const showFavorites = favoritesFilter.checked; // Sprawdź, czy checkbox ulubionych jest zaznaczony

    let filteredOffers = offers;

    // Filtruj po mieście
    if (selectedCity) {
      filteredOffers = filteredOffers.filter(
        (offer) => offer.miasto === selectedCity
      );
    }

    // Filtruj po automatycznej skrzyni biegów
    if (isAutomatic) {
      filteredOffers = filteredOffers.filter(
        (offer) => offer.offer_details?.skrzynia_automatyczna === true
      );
    }

    // Filtruj po dostępności na stanie
    if (inStock) {
      filteredOffers = filteredOffers.filter((offer) => offer.in_stock === 1);
    }

    // Filtruj po wyszukiwanym haśle
    if (searchTerm) {
      filteredOffers = filteredOffers.filter(
        (offer) =>
          offer.model.toLowerCase().includes(searchTerm) ||
          offer.miasto.toLowerCase().includes(searchTerm)
      );
    }

    // Filtruj po ulubionych, jeśli checkbox jest zaznaczony
    if (showFavorites) {
      filteredOffers = filteredOffers.filter((offer) =>
        favorites.includes(offer.id_angebot)
      );
    }

    // Sortowanie po cenie brutto
    if (sortPrice.value === "asc") {
      filteredOffers = filteredOffers.sort(
        (a, b) => a.car_price_disc_gross - b.car_price_disc_gross
      );
    } else if (sortPrice.value === "desc") {
      filteredOffers = filteredOffers.sort(
        (a, b) => b.car_price_disc_gross - a.car_price_disc_gross
      );
    }

    displayOffers(filteredOffers);
  }

  // Nasłuchuj zmiany w filtrach
  cityFilter.addEventListener("change", applyFilters);
  transmissionFilter.addEventListener("change", applyFilters);
  stockFilter.addEventListener("change", applyFilters);
  sortPrice.addEventListener("change", applyFilters);
  searchInput.addEventListener("input", applyFilters);
  favoritesFilter.addEventListener("change", applyFilters); // Dodaj nasłuchiwacza dla checkboxa ulubionych
}

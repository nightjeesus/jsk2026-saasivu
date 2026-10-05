const kaupungit = {
    vaasa: { nimi: "Vaasa", lat: 63.10, lon: 21.62 },
    helsinki: { nimi: "Helsinki", lat: 60.17, lon: 24.94 },
    tampere: { nimi: "Tampere", lat: 61.50, lon: 23.76 },
    oulu: { nimi: "Oulu", lat: 65.01, lon: 25.47 }
};
const lomake = document.getElementById("haku");
const valinta = document.getElementById("kaupunki");
const nappi = document.getElementById("haeNappi");
const tila = document.getElementById("tila");
const tulos = document.getElementById("tulos");

// Haku käynnistyy painikkeesta tai lomakkeen Enter-painalluksesta.
lomake.addEventListener("submit", async (event) => {
    event.preventDefault();
    const kaupunki = kaupungit[valinta.value];
    nappi.disabled = true;
    valinta.disabled = true;
    tulos.hidden = true;
    tila.className = "";
    tila.textContent = "Haetaan säätietoja...";
    const ohjain = new AbortController();
    const aikaraja = setTimeout(() => ohjain.abort(), 15000);
    try {
        const parametrit = new URLSearchParams({
            latitude: kaupunki.lat, longitude: kaupunki.lon,
            current: "temperature_2m,apparent_temperature,wind_speed_10m",
            wind_speed_unit: "ms", timezone: "Europe/Helsinki"
        });
        const vastaus = await fetch("https://api.open-meteo.com/v1/forecast?" + parametrit,
            { signal: ohjain.signal });
        // fetch ei itsessään käsittele HTTP-virhekoodeja virheinä.
        if (!vastaus.ok) throw new Error("HTTP " + vastaus.status);
        const data = await vastaus.json();
        console.log("Rajapinnan vastaus:", data);
        const saa = data.current;
        if (!saa || ![saa.temperature_2m, saa.apparent_temperature, saa.wind_speed_10m].every(Number.isFinite)
            || typeof saa.time !== "string") throw new Error("Puutteellinen säätieto");
        const numero = (arvo) => arvo.toLocaleString("fi-FI", { maximumFractionDigits: 1 });
        document.getElementById("otsikko").textContent = kaupunki.nimi;
        document.getElementById("aika").textContent = "Säätiedon ajankohta: " + saa.time.replace("T", " klo ") + " (Suomen aika)";
        document.getElementById("lampotila").textContent = numero(saa.temperature_2m) + " °C";
        document.getElementById("tuntuu").textContent = numero(saa.apparent_temperature) + " °C";
        document.getElementById("tuuli").textContent = numero(saa.wind_speed_10m) + " m/s";
        tulos.hidden = false;
        tila.textContent = "Säätiedot haettu onnistuneesti.";
    } catch (virhe) {
        console.error("Virhe haussa:", virhe);
        tila.className = "virhe";
        tila.textContent = virhe.name === "AbortError"
            ? "Haku kesti liian kauan. Yritä uudelleen."
            : "Säätietojen haku epäonnistui. Tarkista verkkoyhteys ja yritä uudelleen.";
    } finally {
        clearTimeout(aikaraja);
        nappi.disabled = false;
        valinta.disabled = false;
    }
});

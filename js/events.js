document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("events-list");

  if (!container) {
    console.error("Events container not found.");
    return;
  }

  try {
    const response = await fetch("/events.json");

    if (!response.ok) {
      throw new Error(`Could not load events.json: ${response.status}`);
    }

    const data = await response.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Werkt zowel met:
    // "dates": ["2026-11-28"]
    // als met:
    // "dates": [{"date": "2026-11-28"}]
    function getDateValue(item) {
      if (typeof item === "string") {
        return item;
      }

      if (item && typeof item === "object") {
        return item.date;
      }

      return null;
    }

    function getFutureDates(event) {
      return (event.dates || [])
        .map(getDateValue)
        .filter(Boolean)
        .map(date => new Date(`${date}T00:00:00`))
        .filter(date => !isNaN(date) && date >= today)
        .sort((a, b) => a - b);
    }

    const events = (data.events || [])
      .filter(event => event.published !== false)
      .map(event => {
        const futureDates = getFutureDates(event);

        return {
          ...event,
          nextDate: futureDates[0] || null
        };
      })
      .filter(event => event.nextDate !== null)
      .sort((a, b) => a.nextDate - b.nextDate);

    function renderEvents() {
      const lang = document.documentElement.lang === "en" ? "en" : "nl";
      const locale = lang === "en" ? "en-GB" : "nl-BE";

      container.innerHTML = "";

      events.forEach(event => {
        const article = document.createElement("article");

        const title =
          event.title?.[lang] ||
          event.title?.nl ||
          event.title?.en ||
          "";

        const price =
          event.price?.[lang] ||
          event.price?.nl ||
          event.price?.en ||
          "";

        const description =
          event.description?.[lang] ||
          event.description?.nl ||
          event.description?.en ||
          "";

        const extra =
          event.extra?.[lang] ||
          event.extra?.nl ||
          event.extra?.en ||
          "";

        const linkLabel =
          event.linkLabel?.[lang] ||
          event.linkLabel?.nl ||
          event.linkLabel?.en ||
          (lang === "en" ? "More info" : "Meer informatie");

        const dateText = getFutureDates(event)
          .map(date =>
            date.toLocaleDateString(locale, {
              day: "numeric",
              month: "short",
              year: "numeric"
            })
          )
          .join(" · ");

        article.innerHTML = `
          ${event.image ? `
            <img
              src="${event.image}"
              alt="${title}"
              class="event-image"
            >
          ` : ""}

          <div class="event-content">
            <h3>${title}</h3>

            <div class="event-meta">
              <span>📅 ${dateText}</span>
              ${event.time ? `<span>🕒 ${event.time}</span>` : ""}
              ${price ? `<span>${price}</span>` : ""}
            </div>

            ${description ? `<p>${description}</p>` : ""}

            ${extra ? `<p>${extra}</p>` : ""}

            ${event.location?.name ? `
              <div class="event-location">
                <strong>${event.location.name}</strong>
                ${event.location.address ? `<br>${event.location.address}` : ""}
              </div>
            ` : ""}

            ${event.link ? `
              <p>
                <a href="${event.link}" target="_blank" rel="noopener">
                  ${linkLabel}
                </a>
              </p>
            ` : ""}

            ${event.photographer ? `
              <small>© ${event.photographer}</small>
            ` : ""}
          </div>
        `;

        container.appendChild(article);
      });
    }

    renderEvents();

    const languageObserver = new MutationObserver(() => {
      renderEvents();
    });

    languageObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"]
    });

  } catch (error) {
    console.error("Error loading events:", error);

    const lang = document.documentElement.lang === "en" ? "en" : "nl";

    container.innerHTML =
      lang === "en"
        ? "<p>The events could not be loaded at the moment.</p>"
        : "<p>De agenda kon momenteel niet geladen worden.</p>";
  }
});

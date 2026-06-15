document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-random");
  const card = document.getElementById("featured-card");
 
  if (!btn || !card) return;
 
  btn.addEventListener("click", async () => {
    card.classList.add("loading");
    btn.disabled = true;
 
    try {
      const res = await fetch("/random");
      if (!res.ok) throw new Error("Server error");
      const html = await res.text();
      card.innerHTML = html;
    } catch (err) {
      card.innerHTML = "<p class='error-msg' style='padding:2rem'>Could not load cocktail. Please try again.</p>";
    } finally {
      card.classList.remove("loading");
      btn.disabled = false;
    }
  });
});
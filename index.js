import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
const app = express();
const PORT = process.env.PORT || 3000;
 

const API_BASE = "https://www.thecocktaildb.com/api/json/v1/1";
 

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
 

function parseIngredients(drink) {
  const ingredients = [];
  for (let i = 1; i <= 15; i++) {
    const ingredient = drink[`strIngredient${i}`];
    const measure = drink[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: measure ? measure.trim() : "to taste",
      });
    }
  }
  return ingredients;
}
 

app.get("/", async (req, res) => {
  try {
    
    const { data } = await axios.get(`${API_BASE}/random.php`);
    const drink = data.drinks[0];
 
    res.render("index", {
      featured: {
        ...drink,
        ingredients: parseIngredients(drink),
      },
      error: null,
    });
  } catch (err) {
    console.error("Error fetching random cocktail:", err.message);
    res.render("index", { featured: null, error: "Could not load a featured cocktail. Please try again." });
  }
});
 

app.get("/random", async (req, res) => {
  try {
    const { data } = await axios.get(`${API_BASE}/random.php`);
    const drink = data.drinks[0];
 
    res.render("partials/cocktail-card", {
      drink: { ...drink, ingredients: parseIngredients(drink) },
    });
  } catch (err) {
    console.error("Error fetching random cocktail:", err.message);
    res.status(500).send("<p class='error-msg'>Failed to fetch cocktail. Try again!</p>");
  }
});
 

app.get("/search", async (req, res) => {
  const query = (req.query.q || "").trim();
 
  if (!query) {
    return res.render("search", { query: "", results: [], error: null });
  }
 
  try {
    const { data } = await axios.get(`${API_BASE}/search.php`, {
      params: { s: query },
    });
 
    
    const results = data.drinks
      ? data.drinks.map((d) => ({ ...d, ingredients: parseIngredients(d) }))
      : [];
 
    res.render("search", { query, results, error: null });
  } catch (err) {
    console.error("Search error:", err.message);
    res.render("search", { query, results: [], error: "Search failed. Please try again." });
  }
});
 

app.get("/cocktail/:id", async (req, res) => {
  const { id } = req.params;
 
  try {
    const { data } = await axios.get(`${API_BASE}/lookup.php`, {
      params: { i: id },
    });
 
    if (!data.drinks) {
      return res.status(404).render("error", { message: "Cocktail not found." });
    }
 
    const drink = data.drinks[0];
    res.render("detail", {
      drink: { ...drink, ingredients: parseIngredients(drink) },
    });
  } catch (err) {
    console.error("Detail fetch error:", err.message);
    res.status(500).render("error", { message: "Could not load this cocktail." });
  }
});
 

app.get("/category/:name", async (req, res) => {
  const category = decodeURIComponent(req.params.name);
 
  try {
   
    const { data } = await axios.get(`${API_BASE}/filter.php`, {
      params: { c: category },
    });
 
    if (!data.drinks) {
      return res.render("category", { category, drinks: [], error: null });
    }
 
    
    const preview = data.drinks.slice(0, 12);
    const detailRequests = preview.map((d) =>
      axios.get(`${API_BASE}/lookup.php`, { params: { i: d.idDrink } })
    );
    const responses = await Promise.all(detailRequests);
    const drinks = responses.map((r) => {
      const d = r.data.drinks[0];
      return { ...d, ingredients: parseIngredients(d) };
    });
 
    res.render("category", { category, drinks, error: null });
  } catch (err) {
    console.error("Category fetch error:", err.message);
    res.render("category", { category, drinks: [], error: "Could not load this category." });
  }
});
 

app.use((req, res) => {
  res.status(404).render("error", { message: "Page not found." });
});
 

app.listen(PORT, () => {
  console.log(`🍹 Cocktail Explorer running at http://localhost:${PORT}`);
});
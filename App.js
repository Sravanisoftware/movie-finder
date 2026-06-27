
//  Global Variables

const resultBox = document.querySelector('.result-box');
const inputValue = document.querySelector('.search-section input');
const searchBtn = document.querySelector('.search-section button');
const suggestionsBox = document.querySelector('.suggestions-box');
const recommendations = document.querySelector('.recommendations');
const genreFilter = document.querySelector('.genre-filter');
const key = '82548d1b';

let lastGenreResults = [];


// Search Functionality
const getMovie = (fromGenreList = false) => {
  const movieName = inputValue.value.trim();
  if (!movieName) return;

  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${key}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.Response === 'True') {
        resultBox.innerHTML = `
          ${fromGenreList ? `<button class="back-btn">← Back to List</button>` : ''}
          <div class="img-box">
            <img src="${data.Poster}" alt="Movie Poster">
          </div>
          <h3 class="movie-title" style="color:white;">${data.Title}</h3>
          <div class="rating">
            <i class="fa-solid fa-star"></i>
            <h2>${data.imdbRating}</h2>
          </div>
          <div class="details">
            <span>${data.Year}</span><span>|</span><span>${data.Rated}</span><span>|</span><span>${data.Runtime}</span>
          </div>
          <div class="Genre"><div>${data.Genre.split(",").join("</div><div>")}</div></div>
          <div class="plot"><h2>Plot</h2><span>${data.Plot}</span></div>
          <div class="cast"><h2>Cast</h2><span>${data.Actors}</span></div>
        `;
        resultBox.style.display = 'block';

        if (fromGenreList) {
          const backBtn = document.querySelector('.back-btn');
          backBtn.addEventListener('click', () => {
            renderGenreList(lastGenreResults);
          });
        }
      } else {
        resultBox.innerHTML = `<h3 class="message">${data.Error}</h3>`;
        resultBox.style.display = 'block';
      }
    })
    .catch(() => {
      resultBox.innerHTML = `<h3 class="message">Error Occurred!</h3>`;
      resultBox.style.display = 'block';
    });
};

//  Search & Suggestions


// Handle search button click
searchBtn.addEventListener('click', () => {
  if (inputValue.value.trim() !== '') getMovie();
});

// Handle Enter key
inputValue.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && inputValue.value.trim() !== '') getMovie();
});

// Handle suggestion item clicks
suggestionsBox.addEventListener('click', (e) => {
  const item = e.target.closest('.suggestion-item');
  if (item) {
    inputValue.value = item.getAttribute('data-title');
    getMovie();
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'none';
  }
});

// Handle input typing for suggestions
inputValue.addEventListener('input', async () => {
  const searchText = inputValue.value.trim().toLowerCase();

  if (!searchText) {
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'none';
    return;
  }

  try {
    const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(searchText)}&apikey=${key}`);
    const data = await response.json();

    if (data.Response === 'True') {
      const filtered = data.Search.filter(movie =>
        movie.Title.toLowerCase().includes(searchText)
      );

      const suggestions = filtered.slice(0, 5);
      suggestionsBox.innerHTML = suggestions.map(movie => `
        <div class="suggestion-item" data-title="${movie.Title}">
          <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/30x40'}" />
          <span>${movie.Title} (${movie.Year})</span>
        </div>
      `).join('');

      suggestionsBox.style.display = suggestions.length ? 'block' : 'none';
    } else {
      suggestionsBox.innerHTML = '';
      suggestionsBox.style.display = 'none';
    }
  } catch (err) {
    console.error("Suggestion error:", err);
  }
});


//  Recommended Movies
const recommendedTitles = [
  "Fidaa", "Jersey", "Pushpa: The Rule - Part 2", "Pokiri", "Salaar"
];

recommendedTitles.forEach(title => {
  fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${key}`)
    .then(res => res.json())
    .then(data => {
      if (data.Response === "True") {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.innerHTML = `
          <img src="${data.Poster !== "N/A" ? data.Poster : 'https://via.placeholder.com/60x90'}" alt="${data.Title}">
          <div class="movie-info">
            <h4>${data.Title}</h4>
            <p>⭐ ${data.imdbRating}</p>
          </div>
        `;
        movieCard.addEventListener('click', () => {
          inputValue.value = data.Title;
          getMovie();
        });
        recommendations.appendChild(movieCard);
      }
    })
    .catch(err => console.error("Error fetching recommended movie:", err));
});


//  Genre Filter
const genreKeywords = ["love", "war", "life", "day", "night", "king", "girl", "boy", "story", "dark"];

genreFilter.addEventListener('change', async () => {
  const selectedGenre = genreFilter.value;
  resultBox.innerHTML = '';

  try {
    let allGenreResults = [];

    for (const keyword of genreKeywords) {
      for (let page = 1; page <= 2; page++) {
        const response = await fetch(`https://www.omdbapi.com/?s=${keyword}&page=${page}&apikey=${key}`);
        const data = await response.json();

        if (data.Response === 'True') {
          const detailedMovies = await Promise.all(
            data.Search.map(async movie => {
              const res = await fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${key}`);
              return res.json();
            })
          );
          allGenreResults.push(...detailedMovies);
        }
      }
    }

    const uniqueMovies = {};
    allGenreResults.forEach(movie => {
      uniqueMovies[movie.imdbID] = movie;
    });
    allGenreResults = Object.values(uniqueMovies);

    const filteredResults = selectedGenre === 'all'
      ? allGenreResults
      : allGenreResults.filter(movie =>
          movie.Genre && movie.Genre.toLowerCase().includes(selectedGenre.toLowerCase())
        );

    renderGenreList(filteredResults);
    lastGenreResults = filteredResults;
  } catch (error) {
    console.error('Error filtering by genre:', error);
  }
});


// Helper Functions
function renderGenreList(movies) {
  resultBox.innerHTML = '';
  movies.forEach(data => {
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');
    movieCard.innerHTML = `
      <img src="${data.Poster !== "N/A" ? data.Poster : 'https://via.placeholder.com/60x90'}" alt="${data.Title}">
      <div class="movie-info">
        <h4>${data.Title}</h4>
        <p>⭐ ${data.imdbRating}</p>
      </div>
    `;
    movieCard.addEventListener('click', () => {
      inputValue.value = data.Title;
      getMovie(true);
    });
    resultBox.appendChild(movieCard);
  });
  resultBox.style.display = 'block';
}


// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  genreFilter.value = 'all';
  genreFilter.dispatchEvent(new Event('change'));
});
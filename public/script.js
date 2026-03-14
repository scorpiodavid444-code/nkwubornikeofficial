const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");

/* ===============================
HAMBURGER
=============================== */

hamburger.addEventListener("click", () => {

  navMenu.classList.toggle("active");

  hamburger.textContent =
    navMenu.classList.contains("active") ? "✕" : "☰";

});


/* ===============================
CLOSE MENU ON LINK CLICK
=============================== */

document.querySelectorAll("#nav-menu a").forEach(link => {

  link.addEventListener("click", e => {

    if (link.classList.contains("dropdown-toggle")) return;

    navMenu.classList.remove("active");
    hamburger.textContent = "☰";

  });

});


/* ===============================
DROPDOWN MOBILE TOGGLE
=============================== */

document.querySelectorAll(".dropdown-toggle").forEach(toggle => {

  toggle.addEventListener("click", e => {

    if (window.innerWidth > 900) return;

    e.preventDefault();

    const dropdown = toggle.nextElementSibling;

    dropdown.classList.toggle("show");

  });

});


    let slideIndex = 1;
    showSlides(slideIndex);

    function plusSlides(n) {
      showSlides(slideIndex += n);
    }

    function showSlides(n) {
      let slides = document.getElementsByClassName("conferences-slide");

      if (n > slides.length) { slideIndex = 1 }
      if (n < 1) { slideIndex = slides.length }

      for (let i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
      }

      slides[slideIndex - 1].classList.add("active");
    }

    // Optional: Auto advance every 6 seconds
    setInterval(() => {
      plusSlides(1);
    }, 6000);


    let slides = document.querySelectorAll(".slide");
let index = 0;

function showSlide(i){

slides.forEach(slide => slide.classList.remove("active"));

slides[i].classList.add("active");

}

document.querySelector(".next").onclick = () => {

index++;

if(index >= slides.length) index = 0;

showSlide(index);

}

document.querySelector(".prev").onclick = () => {

index--;

if(index < 0) index = slides.length - 1;

showSlide(index);

}



const NEWS_SOURCE = "/news.json";

const LIMITS = {
  trending: 1,
  frontview: 3
};

// Global storage
let originalPosts = [];     
let displayedPosts = [];     
let activeTag = null;
let activeCategory = null;

// -------------------------------
// THUMBNAIL GENERATOR
// -------------------------------
function getThumbnail(post) {
  if (post.thumbnail) return post.thumbnail;

  if (post.video || post.video_url) {
  const url = post.video || post.video_url;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/thumbnail?id=${match[1]}`;
}

  return post.image || "";
}

// -------------------------------
// INIT
// -------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded → starting loadPosts()");
  await loadPosts();
  setupNavigation();
  setupCategoryFilters();
  setupBackButton();
  renderNewsStrip();
});


// -------------------------------
// LOAD POSTS
// -------------------------------

async function loadPosts() {
  console.log("Attempting to load real news.json");

  try {
    const res = await fetch(NEWS_SOURCE + '?t=' + Date.now());
    console.log("Fetch status code:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const text = await res.text();
    console.log("Raw response preview:", text.substring(0, 200) + "...");

    const data = JSON.parse(text);
    originalPosts = data || [];
    console.log("Real data loaded → count:", originalPosts.length);

  } catch (err) {
    console.error("Failed to load news.json:", err.message);
    originalPosts = [];
    console.log("No posts available");
  }

  displayedPosts = enforcePlacementLimits([...originalPosts]);
  renderTrending();
  renderFrontView();
  renderLatest();
  renderNewsStrip();
}

function enforcePlacementLimits(postsArray) {
  const trending = postsArray
    .filter(p => p.placement?.includes("trending"))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 1);

  const frontview = postsArray
    .filter(p => p.placement?.includes("frontview"))
    .sort((a, b) => (a.front_priority || 99) - (b.front_priority || 99))
    .slice(0, 3);

  return postsArray.map(post => {
    let placement = [...(post.placement || [])];

    if (placement.includes("trending") && !trending.some(t => t.slug === post.slug)) {
      placement = placement.filter(p => p !== "trending");
      if (!placement.includes("latest")) placement.push("latest");
    }

    if (placement.includes("frontview") && !frontview.some(f => f.slug === post.slug)) {
      placement = placement.filter(p => p !== "frontview");
      if (!placement.includes("latest")) placement.push("latest");
    }

    return { ...post, placement };
  });
}


function renderAll() {
  renderTrending();
  renderFrontView();
  renderLatest();
}

// -------------------------------
// TRENDING (MAX 1)
// -------------------------------

function renderTrending() {
  const trendingEl = document.getElementById("trending-story");
  if (!trendingEl) return;

  const trendingPosts = displayedPosts.filter(p => p.placement?.includes("trending"));
  const trendingPost = trendingPosts[0];

  if (!trendingPost) {
    trendingEl.innerHTML = ""; // or "No trending story"
    return;
  }

  trendingEl.innerHTML = `
    <a href="#" data-slug="${trendingPost.slug}" class="story-link">
      ${trendingPost.title}
    </a>
  `;

  attachStoryEvents();
}


// -------------------------------
// FRONT VIEW (MAX 3)
// -------------------------------

function renderFrontView() {
  console.log("Starting renderFrontView()");

  const posts = displayedPosts
    .filter(p => p.placement?.includes("frontview"))
    .sort((a, b) => (a.front_priority || 99) - (b.front_priority || 99))
    .slice(0, 3);

  console.log("Frontview posts found:", posts.length);
  if (posts.length === 0) {
    console.log("No frontview posts → skipping hero rendering");
    return;
  }

  const main = posts[0];
  const side1 = posts[1];
  const side2 = posts[2];

  console.log("Main hero:", main?.title || "none");
  console.log("Side 1:", side1?.title || "none");
  console.log("Side 2:", side2?.title || "none");

  renderHero("#front-main", main, true);
  renderHero("#front-side-1", side1);
  renderHero("#front-side-2", side2);
}

// -------------------------------
// HERO RENDER
// -------------------------------

function renderHero(selector, post, isMain = false) {
  if (!post) {
    console.log(`No post provided for ${selector} → skipping`);
    return;
  }

  const fallbackImages = [
    "/images/img-long.jpg",
    "/images/img3.jpg",
    "/images/img1.jpg"
  ];

  let imgUrl = getThumbnail(post);

  if (!imgUrl) {
    if (isMain) imgUrl = fallbackImages[0];
    else if (selector === "#front-side-1") imgUrl = fallbackImages[1];
    else imgUrl = fallbackImages[2];
  }

  const el = document.querySelector(selector);

  if (!el) {
    console.error(`Element not found: ${selector}`);
    return;
  }

  const hasVideo = post.video || post.video_url;

  el.innerHTML = `
    <div class="article-image" style="background-image:url('${imgUrl}')">

      ${hasVideo ? `<div class="play-btn">▶</div>` : ""}

      <div class="date">${formatDate(post.date)}</div>

    </div>

    <h2>
      <a href="#" data-slug="${post.slug}" class="story-link">
        ${post.title}
      </a>
    </h2>
  `;

  attachStoryEvents();
}

// -------------------------------
// LATEST NEWS (CAROUSEL + PAGINATION)
// -------------------------------

let latestIndex = 0;
let latestPosts = [];
let latestTimer = null;

function renderLatest() {
  console.log("Starting renderLatest()");

  const carousel = document.querySelector(".news-carousel");
  const pagination = document.getElementById("latest-pagination");

  if (!carousel) {
    console.warn("Carousel .news-carousel not found");
    return;
  }

  latestPosts = displayedPosts
    .filter(p => p.placement?.includes("latest"))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  console.log("Latest posts found:", latestPosts.length);
  if (latestPosts.length === 0) {
    console.log("No latest posts → skipping carousel");
    return;
  }

  console.log("First latest post:", latestPosts[0]?.title);

  /* render first slide */
  showLatestSlide(0);

  /* pagination buttons */
  if (pagination) {
    pagination.innerHTML = latestPosts.map((p, i) => `
      <button class="latest-page-btn" data-index="${i}">
        ${i + 1}
      </button>
    `).join("");

    document.querySelectorAll(".latest-page-btn").forEach(btn => {
      btn.onclick = () => {
        latestIndex = Number(btn.dataset.index);
        showLatestSlide(latestIndex);
        restartCarousel();
      };
    });
  }

  restartCarousel();
}

function showLatestSlide(index) {

  const carousel = document.querySelector(".news-carousel");
  const post = latestPosts[index];

  if (!post) return;

  let imgUrl = getThumbnail(post);

  const hasVideo = post.video || post.video_url;

  carousel.innerHTML = `
    <div class="latest-card">

      <div class="latest-img" style="background-image:url('${imgUrl}')">

        ${hasVideo ? `<div class="play-btn">▶</div>` : ""}

      </div>

      <h3>
        <a href="#" data-slug="${post.slug}" class="story-link">
          ${post.title}
        </a>
      </h3>

      <p>${post.description || ""}</p>

    </div>
  `;

  attachStoryEvents();

  // highlight active dot
  document.querySelectorAll(".latest-page-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === latestIndex);
  });
}


function restartCarousel() {
  if (latestTimer) clearInterval(latestTimer);

  latestTimer = setInterval(() => {
    latestIndex++;
    if (latestIndex >= latestPosts.length) {
      latestIndex = 0;
    }
    showLatestSlide(latestIndex);
  }, 3000);
}


// -------------------------------
// ARTICLES (UNLIMITED)
// -------------------------------

function renderNewsStrip() {

  const strip = document.getElementById("news-strip");
  if (!strip) return;

  const posts = displayedPosts
    .filter(p => p.placement?.includes("article"))
    .sort((a,b)=> new Date(b.date) - new Date(a.date));

  strip.innerHTML = posts.map(post => {

    const hasVideo = post.video || post.video_url;

    return `

      <article class="news-card">

        <div class="news-thumb">

          <img src="${getThumbnail(post)}" alt="${post.title}">

          ${hasVideo ? `<div class="play-btn">▶</div>` : ""}

        </div>

        <div class="news-overlay">

          <span class="news-category">
            ${post.category || "News"}
          </span>

          <h3>
            <a href="#" data-slug="${post.slug}" class="story-link">
              ${post.title}
            </a>
          </h3>

        </div>

      </article>

    `;

  }).join("");

  attachStoryEvents();

  // duplicate items for seamless scroll
  const items = Array.from(strip.children);

  items.forEach(item=>{
    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", true);
    strip.appendChild(clone);
  });

}


// -------------------------------
// STORY VIEW
// -------------------------------
function openStory(slug) {
  const post = originalPosts.find(p => p.slug === slug);
  if (!post) return;

  const container = document.getElementById("story-container");

  // Only show thumbnail if there is no video
  const thumbnailHtml = (!post.video_url && !post.video)
    ? `<img src="${getThumbnail(post)}" style="width:100%; margin:20px 0">`
    : "";

  container.innerHTML = `
    <h1>${post.title}</h1>
    <p class="date">${formatDate(post.date)}</p>
    ${thumbnailHtml}
    ${renderVideo(post)}
    <div class="story-content">
      ${post.content}
    </div>
  `;

  document.querySelectorAll("section, main").forEach(s => {
    if (!s.id || s.id !== "story-view") s.style.display = "none";
  });

  document.getElementById("story-view").style.display = "block";
  window.scrollTo(0, 0);
}


// -------------------------------
// VIDEO SUPPORT (MP4 + Google Drive)
// -------------------------------
function renderVideo(post) {
  const url = post.video_url || post.video;
  if (!url) return "";

  // Direct MP4/WebM video
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return `
      <div class="video-container">
        <video width="100%" height="500" controls preload="metadata">
          <source src="${url}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
    `;
  }

  // Google Drive video embed
  const embed = convertDriveLink(url);
  return `
    <div class="video-container">
      <iframe
        src="${embed}"
        width="100%"
        height="500"
        frameborder="0"
        allow="autoplay; fullscreen"
        allowfullscreen>
      </iframe>
    </div>
  `;
}


// -------------------------------
// Convert Google Drive link to preview
// -------------------------------
function convertDriveLink(url) {
  if (!url) return "";
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return url;
  return `https://drive.google.com/file/d/${match[1]}/preview`;
}

// -------------------------------
// BACK BUTTON
// -------------------------------

function setupBackButton(){

const btn = document.getElementById("back-btn");

if(!btn) return;

btn.addEventListener("click", ()=>{

document.getElementById("story-view").style.display="none";

document.querySelectorAll("section, main").forEach(s=>{
if(!s.id || s.id !== "story-view") s.style.display="";
});

window.scrollTo(0,0);

});

}


// -------------------------------
// STORY LINK EVENTS
// -------------------------------

function attachStoryEvents(){

document.querySelectorAll(".story-link").forEach(link=>{

link.onclick = (e)=>{

e.preventDefault();

openStory(link.dataset.slug);

};

});

}


// -------------------------------
// TAG FILTERS
// -------------------------------

function setupNavigation() {
  document.querySelectorAll("[data-tag]").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      activeTag = el.dataset.tag;
      activeCategory = null;        
      filterPosts();
    });
  });
}


// -------------------------------
// CATEGORY FILTERS
// -------------------------------

function setupCategoryFilters() {
  document.querySelectorAll("[data-category]").forEach(el => {
    el.addEventListener("click", () => {
      activeCategory = el.dataset.category;
      activeTag = null;           
      filterPosts();
    });
  });
}

// -------------------------------
// FILTER ENGINE
// -------------------------------

function filterPosts() {
  let filtered = [...originalPosts];

  if (activeTag) {
    filtered = filtered.filter(p => p.tag === activeTag);
  }

  if (activeCategory) {
    filtered = filtered.filter(p => p.category === activeCategory);
  }

 displayedPosts = enforcePlacementLimits(filtered);
 renderTrending();
renderFrontView();
renderLatest();
renderNewsStrip();
}


// -------------------------------
// UTILITIES
// -------------------------------

function formatDate(date){

return new Date(date).toLocaleDateString("en-US",{
year:"numeric",
month:"long",
day:"numeric"
});

}

!function(d,s,id){
var js,fjs=d.getElementsByTagName(s)[0];
if(!d.getElementById(id)){
js=d.createElement(s);
js.id=id;
js.src='https://weatherwidget.io/js/widget.min.js';
fjs.parentNode.insertBefore(js,fjs);
}
}(document,'script','weatherwidget-io-js');
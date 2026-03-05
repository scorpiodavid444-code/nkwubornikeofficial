// ===============================
// Community News Box Engine
// Works with Netlify CMS + JSON
// ===============================

// -------------------------------
// CONFIG
// -------------------------------

const NEWS_SOURCE = "/content/news.json"; 
// Later Netlify CMS will generate this

// Placement limits
const LIMITS = {
trending: 1,
frontview: 3
};

// Global storage
let allPosts = [];
let activeTag = null;
let activeCategory = null;

// -------------------------------
// THUMBNAIL GENERATOR
// -------------------------------
function getThumbnail(post) {
  if(post.thumbnail) return post.thumbnail; // CMS-provided thumbnail
  if(post.video_url) {
    const match = post.video_url.match(/\/d\/(.*?)\//);
    if(match) return `https://drive.google.com/thumbnail?id=${match[1]}`;
  }
  return post.image || ""; // fallback to main image
}

// -------------------------------
// INIT
// -------------------------------

document.addEventListener("DOMContentLoaded", async () => {

await loadPosts();

renderTrending();
renderFrontView();
renderLatest();
renderArticles();

setupNavigation();
setupCategoryFilters();
setupBackButton();

});


// -------------------------------
// LOAD POSTS
// -------------------------------

async function loadPosts(){

try{

const res = await fetch(NEWS_SOURCE);
allPosts = await res.json();

}catch(err){

console.warn("Using fallback demo data");

allPosts = getDemoPosts();

}

}


// -------------------------------
// TRENDING (MAX 1)
// -------------------------------

function renderTrending(){

const trendingEl = document.getElementById("trending-story");

const trendingPost = allPosts
.filter(p => p.placement?.includes("trending"))
.slice(0,1)[0];

if(!trendingPost) return;

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

function renderFrontView(){

const posts = allPosts
.filter(p => p.placement?.includes("frontview"))
.sort((a,b)=> (a.front_priority||99)-(b.front_priority||99))
.slice(0,3);

if(posts.length === 0) return;

const main = posts[0];
const side1 = posts[1];
const side2 = posts[2];

renderHero("#front-main", main, true);
renderHero("#front-side-1", side1);
renderHero("#front-side-2", side2);

}


// -------------------------------
// HERO RENDER
// -------------------------------

function renderHero(selector, post, isMain=false){

if(!post) return;

const el = document.querySelector(selector);

el.innerHTML = `
<div class="article-image" style="background-image:url('${getThumbnail(post)}')">
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

function renderLatest(){

const carousel = document.querySelector(".news-carousel");
const pagination = document.getElementById("latest-pagination");

latestPosts = allPosts
.filter(p => p.placement?.includes("latest"))
.sort((a,b)=> new Date(b.date) - new Date(a.date));

if(!carousel || latestPosts.length === 0) return;

/* render first slide */
showLatestSlide(0);

/* pagination buttons */

if(pagination){

pagination.innerHTML = latestPosts.map((p,i)=>`

<button class="latest-page-btn" data-index="${i}">
${i+1}
</button>

`).join("");

document.querySelectorAll(".latest-page-btn")
.forEach(btn=>{

btn.onclick = ()=>{

latestIndex = Number(btn.dataset.index);

showLatestSlide(latestIndex);

restartCarousel();

};

});

}

restartCarousel();

}

function showLatestSlide(index){

const carousel = document.querySelector(".news-carousel");

const post = latestPosts[index];

carousel.innerHTML = `

<div class="latest-card">

<div class="latest-img"
style="background-image:url('${getThumbnail(post)}')"></div>

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
document.querySelectorAll(".latest-page-btn")
.forEach((btn,i)=>{
btn.classList.toggle("active", i === latestIndex);
});

}

function restartCarousel(){

if(latestTimer) clearInterval(latestTimer);

latestTimer = setInterval(()=>{

latestIndex++;

if(latestIndex >= latestPosts.length){
latestIndex = 0;
}

showLatestSlide(latestIndex);

},3000);

}

// -------------------------------
// ARTICLES (UNLIMITED)
// -------------------------------

function renderArticles(){

const container = document.getElementById("article-container");

const articles = allPosts
.filter(p => p.placement?.includes("article"));

container.innerHTML = articles.map(post => `

<article>

<img src="${getThumbnail(post)}" alt="${post.title}">

<h3>
<a href="#" data-slug="${post.slug}" class="story-link">
${post.title}
</a>
</h3>

<p>${post.description || ""}</p>

</article>

`).join("");

attachStoryEvents();

}


// -------------------------------
// STORY VIEW
// -------------------------------

function openStory(slug){

const post = allPosts.find(p=>p.slug===slug);
if(!post) return;

const container = document.getElementById("story-container");

container.innerHTML = `

<h1>${post.title}</h1>

<p class="date">${formatDate(post.date)}</p>

<img src="${getThumbnail(post)}" style="width:100%; margin:20px 0">

${renderVideo(post)}

<div class="story-content">

${post.content}

</div>

`;

document.querySelectorAll("section, main").forEach(s=>{
if(!s.id || s.id !== "story-view") s.style.display="none";
});

document.getElementById("story-view").style.display="block";

window.scrollTo(0,0);

}


// -------------------------------
// VIDEO SUPPORT
// Google Drive Embed
// -------------------------------

function renderVideo(post){

if(!post.video_url) return "";

let embed = convertDriveLink(post.video_url);

return `

<div class="video-container">

<iframe
src="${embed}"
width="100%"
height="500"
frameborder="0"
allowfullscreen>
</iframe>

</div>

`;

}


// convert google drive share link to embed
function convertDriveLink(url){

if(!url) return "";

const match = url.match(/\/d\/(.*?)\//);

if(!match) return url;

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

function setupNavigation(){

document.querySelectorAll("[data-tag]").forEach(el=>{

el.addEventListener("click", e=>{

e.preventDefault();

activeTag = el.dataset.tag;

filterPosts();

});

});

}


// -------------------------------
// CATEGORY FILTERS
// -------------------------------

function setupCategoryFilters(){

document.querySelectorAll("[data-category]").forEach(el=>{

el.addEventListener("click", ()=>{

activeCategory = el.dataset.category;

filterPosts();

});

});

}


// -------------------------------
// FILTER ENGINE
// -------------------------------

function filterPosts(){

let filtered = allPosts;

if(activeTag){

filtered = filtered.filter(p=>p.tags?.includes(activeTag));

}

if(activeCategory){

filtered = filtered.filter(p=>p.category === activeCategory);

}

allPosts = filtered;

renderTrending();
renderFrontView();
renderLatest();
renderArticles();

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


// -------------------------------
// DEMO DATA
// used before CMS
// -------------------------------

function getDemoPosts(){

return [

{
title:"Traffic Problems In Time Square",
slug:"traffic-times-square",
date:"2026-03-01",
image:"https://via.placeholder.com/600x400?text=Times+Square",
description:"Major traffic gridlock reported.",
content:"<p>Full story content goes here.</p>",
tags:["international"],
category:"politics",
placement:["trending","frontview","latest"],
front_priority:1
},

{
title:"Best Way To Spend Your Holiday",
slug:"holiday-guide",
date:"2026-03-02",
image:"https://via.placeholder.com/300x200?text=Holiday",
description:"Travel tips and destinations.",
content:"<p>Holiday story here.</p>",
tags:["lifestyle"],
category:"entertainment",
placement:["frontview","latest"],
front_priority:2
},

{
title:"Weekend Sports Results",
slug:"sports-weekend",
date:"2026-03-03",
image:"https://via.placeholder.com/300x200?text=Sports",
description:"Match results and highlights.",
content:"<p>Sports story here.</p>",
tags:["sport"],
category:"entertainment",
placement:["frontview","latest","article"],
front_priority:3
}

];

}
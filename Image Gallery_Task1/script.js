window.addEventListener("error", function (e) {
    console.error("Gallery Error:", e.message);
});

const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const deleteBtn = document.getElementById("deleteBtn");
const downloadBtn = document.getElementById("downloadBtn");
const categoryFilter = document.getElementById("categoryFilter");
const addImageForm = document.getElementById("addImageForm");

let currentIndex = 0;

/* Load images from localStorage or default */
let imagesData = JSON.parse(localStorage.getItem("galleryImages")) || [
    { src: "images/n3.jpg", title: "Forest", category: "nature" },
    { src: "images/c2.jpg", title: "City Lights", category: "city" },
    { src: "images/animal.jpg", title: "Lion", category: "animals" },
    { src: "images/nature1.jpg", title: "Natures Gate", category: "nature" },
    { src: "images/city1.jpg", title: "City DayTime", category: "city" },
    { src: "images/city3.jpg", title: "City DuskTime", category: "city" },
    { src: "images/nature 4.jpg", title: "Beauty Of Night Sky", category: "nature" },
    { src: "images/nature2.jpg", title: "Mountain Area", category: "nature" },
    { src: "images/city4.jpg", title: "Beauty Of Paris", category: "city" }
];

/* Save to storage */
function saveImages() {
    localStorage.setItem("galleryImages", JSON.stringify(imagesData));
}

/* Render Gallery */
function renderGallery(filter = "all") {
    gallery.innerHTML = "";

    imagesData.forEach((img, realIndex) => {
        if (filter !== "all" && img.category !== filter) return;

        const card = document.createElement("div");
        card.className = "card";
        card.dataset.index = realIndex;
        card.style.position = "relative"; // Ensure delete icon positions correctly

        card.innerHTML = `
            <img src="${img.src}" loading="lazy">
            <div class="overlay">
                <div>
                    <h4>${img.title}</h4>
                    <span>${img.category}</span>
                </div>
            </div>
            <div class="delete" title="Delete image">🗑️</div>
        `;

        card.addEventListener("click", () => openLightbox(realIndex));

        card.querySelector(".delete").addEventListener("click", (e) => {
            e.stopPropagation();
            confirmDelete(realIndex);
        });

        gallery.appendChild(card);
    });
}

renderGallery();

/* Add Image */
addImageForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];

    if (!file || !file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
    }

    const title = document.getElementById("titleInput").value.trim();
    const category = document.getElementById("categoryInput").value;

    const reader = new FileReader();

    reader.onload = function () {
        imagesData.unshift({
            src: reader.result,
            title,
            category
        });

        saveImages();
        renderGallery(categoryFilter.value);
        addImageForm.reset();
    };

    reader.readAsDataURL(file);
});

/* Lightbox */
function openLightbox(index) {
    currentIndex = index;
    lightbox.style.display = "flex";
    updateLightbox();
}

function updateLightbox() {
    const img = imagesData[currentIndex];
    if (!img) return;
    lightboxImg.src = img.src;
    downloadBtn.href = img.src;
}

document.querySelector(".close").onclick = () => {
    lightbox.style.display = "none";
};

document.querySelector(".next").onclick = () => {
    currentIndex = (currentIndex + 1) % imagesData.length;
    updateLightbox();
};

document.querySelector(".prev").onclick = () => {
    currentIndex = (currentIndex - 1 + imagesData.length) % imagesData.length;
    updateLightbox();
};

/* Delete Logic */
function confirmDelete(index) {
    const confirmed = confirm("Are you sure you want to delete this image?");
    if (confirmed) {
        deleteImage(index);
    }
}

function deleteImage(index) {
    imagesData.splice(index, 1);
    saveImages();
    renderGallery(categoryFilter.value);
    lightbox.style.display = "none";
}

/* Delete from Lightbox */
deleteBtn.onclick = () => {
    confirmDelete(currentIndex);
};

/* Category Filter */
categoryFilter.onchange = (e) => {
    renderGallery(e.target.value);
};
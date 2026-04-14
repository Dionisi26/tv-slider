window.onload = () => {
    if (!window.db) {
        console.error("Firebase belum siap.");
        return;
    }

    const STORAGE_PATH = 'slides/';

    /* =========================================
       1. LOGIKA UNTUK LAYAR TV (index.html)
       ========================================= */
    const track = document.getElementById('sliderTrack');
    let autoPlayInterval;

    if (track) {
        window.dbOnValue(window.dbRef(window.db, STORAGE_PATH), (snapshot) => {
            const data = snapshot.val();
            const slidesArray = data ? Object.values(data) : [];
            
            track.innerHTML = '';
            document.getElementById('sliderDots').innerHTML = '';

            if (slidesArray.length === 0) {
                track.innerHTML = '<div class="slide" style="background:#000;"><h1 style="color:white;">Belum ada informasi yang ditampilkan.</h1></div>';
                return;
            }

            renderSlides(slidesArray);
        });

        function renderSlides(slidesArray) {
            const dotsContainer = document.getElementById('sliderDots');
            
            slidesArray.forEach((data, index) => {
                const slide = document.createElement('div');
                slide.classList.add('slide');
                
                if (data.type === 'image' && data.image) {
                    // Tampilkan Gambar Penuh
                    slide.style.backgroundImage = `url('${data.image}')`;
                    slide.style.backgroundSize = "contain"; 
                    slide.style.backgroundRepeat = "no-repeat";
                    slide.style.backgroundPosition = "center";
                    slide.style.backgroundColor = "#000000"; // Hitam di sisi kosong
                } else {
                    // Tampilkan Teks
                    slide.style.backgroundColor = data.color || '#333';
                    slide.innerHTML = `
                        <div class="slide-content">
                            <h2>${data.title}</h2>
                            <p>${data.desc}</p>
                        </div>
                    `;
                }

                track.appendChild(slide);

                const dot = document.createElement('div');
                dot.classList.add('dot');
                if (index === 0) dot.classList.add('active');
                dotsContainer.appendChild(dot);
            });

            startSliderLogic(slidesArray.length);
        }

        function startSliderLogic(slideCount) {
            let currentIndex = 0;
            const dots = Array.from(document.getElementById('sliderDots').children);

            const updateSlider = () => {
                track.style.transform = `translateX(-${currentIndex * 100}vw)`;
                dots.forEach(d => d.classList.remove('active'));
                if(dots[currentIndex]) dots[currentIndex].classList.add('active');
            };

            const goToSlide = (index) => { currentIndex = index; updateSlider(); resetAutoPlay(); };
            const nextSlide = () => { currentIndex = (currentIndex === slideCount - 1) ? 0 : currentIndex + 1; updateSlider(); };
            const prevSlide = () => { currentIndex = (currentIndex === 0) ? slideCount - 1 : currentIndex - 1; updateSlider(); };

            const nextBtn = document.getElementById('nextBtn');
            const prevBtn = document.getElementById('prevBtn');
            if(nextBtn) nextBtn.onclick = () => { nextSlide(); resetAutoPlay(); };
            if(prevBtn) prevBtn.onclick = () => { prevSlide(); resetAutoPlay(); };

            dots.forEach((dot, index) => {
                dot.onclick = () => goToSlide(index);
            });

            const startAutoPlay = () => { 
                clearInterval(autoPlayInterval);
                autoPlayInterval = setInterval(nextSlide, 7000); // Ganti tiap 7 detik
            };
            const resetAutoPlay = () => { 
                clearInterval(autoPlayInterval); 
                startAutoPlay(); 
            };
            
            startAutoPlay();
        }
    }

    /* =========================================
       2. LOGIKA UNTUK CMS ADMIN (admin.html)
       ========================================= */
    const cmsForm = document.getElementById('cmsForm');
    if (cmsForm) {
        cmsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = Date.now().toString();
            const type = document.getElementById('infoType').value;
            let imageUrl = document.getElementById('slideImage').value;

            // Fitur auto-koreksi Imgur (Jika user lupa tambah .jpg)
            if (type === 'image' && imageUrl.includes('imgur.com') && !imageUrl.match(/\.(jpeg|jpg|gif|png)$/)) {
                imageUrl += '.jpg'; 
            }

            const newSlide = {
                type: type,
                title: type === 'text' ? document.getElementById('slideTitle').value : "",
                desc: type === 'text' ? document.getElementById('slideDesc').value : "",
                color: type === 'text' ? document.getElementById('slideColor').value : "#000000",
                image: type === 'image' ? imageUrl : ""
            };

            window.dbSet(window.dbRef(window.db, STORAGE_PATH + id), newSlide)
                .then(() => {
                    document.getElementById('slideTitle').value = "";
                    document.getElementById('slideDesc').value = "";
                    document.getElementById('slideImage').value = "";
                    alert("✅ Slide berhasil ditambahkan ke TV!");
                })
                .catch((error) => alert("Gagal: " + error.message));
        });

        // Tampilkan Daftar Slide untuk Dihapus
        window.dbOnValue(window.dbRef(window.db, STORAGE_PATH), (snapshot) => {
            const listContainer = document.getElementById('adminSlideList');
            listContainer.innerHTML = '<h3>Daftar Slide Aktif di TV</h3>';
            const data = snapshot.val();
            
            if(data) {
                for (let id in data) {
                    const item = document.createElement('div');
                    item.classList.add('slide-item');
                    const labelInfo = data[id].type === 'image' ? `🖼️ [GAMBAR] ${data[id].image.substring(0,30)}...` : `📝 [TEKS] ${data[id].title}`;
                    
                    item.innerHTML = `
                        <span><strong>${labelInfo}</strong></span>
                        <button class="btn btn-danger" onclick="deleteSlide('${id}')">Hapus Layar</button>
                    `;
                    listContainer.appendChild(item);
                }
            } else {
                listContainer.innerHTML += '<p style="color:#666;">Belum ada slide aktif.</p>';
            }
        });

        window.deleteSlide = (id) => {
            if(confirm("Apakah Anda yakin ingin menghapus slide ini dari layar TV?")) {
                window.dbRemove(window.dbRef(window.db, STORAGE_PATH + id));
            }
        };
    }
};

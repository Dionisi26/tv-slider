window.onload = () => {
    if (!window.db) return;

    const STORAGE_PATH = 'slides/';
    const DISPLAY_DURATION = 30000; // DURASI: 30 Detik
    let allSlidesGlobal = []; // Menyimpan data sementara untuk fungsi pindah posisi

    /* =========================================
       1. LOGIKA UNTUK LAYAR TV (index.html)
       ========================================= */
    const track = document.getElementById('sliderTrack');
    let autoPlayInterval;

    if (track) {
        window.dbOnValue(window.dbRef(window.db, STORAGE_PATH), (snapshot) => {
            const data = snapshot.val();
            let slidesArray = [];
            
            // Konversi objek ke array dan tambahkan ID asli
            for (let id in data) {
                slidesArray.push({ id, ...data[id] });
            }
            
            // URUTKAN berdasarkan properti 'order'
            slidesArray.sort((a, b) => (a.order || 0) - (b.order || 0));

            track.innerHTML = '';
            document.getElementById('sliderDots').innerHTML = '';

            if (slidesArray.length === 0) {
                track.innerHTML = '<div class="slide"><h1>Belum ada informasi.</h1></div>';
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
                    slide.style.backgroundImage = `url('${data.image}')`;
                    slide.style.backgroundSize = "contain"; 
                    slide.style.backgroundRepeat = "no-repeat";
                    slide.style.backgroundPosition = "center";
                    slide.style.backgroundColor = "#000";
                } else {
                    slide.style.backgroundColor = data.color || '#333';
                    slide.innerHTML = `<div class="slide-content"><h2>${data.title}</h2><p>${data.desc}</p></div>`;
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
            const nextSlide = () => { currentIndex = (currentIndex + 1) % slideCount; updateSlider(); };
            
            clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(nextSlide, DISPLAY_DURATION);
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

            if (type === 'image' && imageUrl.includes('imgur.com') && !imageUrl.match(/\.(jpeg|jpg|png)$/)) {
                imageUrl += '.jpg'; 
            }

            const newSlide = {
                type: type,
                title: type === 'text' ? document.getElementById('slideTitle').value : "",
                desc: type === 'text' ? document.getElementById('slideDesc').value : "",
                color: type === 'text' ? document.getElementById('slideColor').value : "#000",
                image: type === 'image' ? imageUrl : "",
                order: allSlidesGlobal.length // Otomatis taruh di urutan paling bawah
            };

            window.dbSet(window.dbRef(window.db, STORAGE_PATH + id), newSlide)
                .then(() => { cmsForm.reset(); alert("✅ Ditambahkan!"); });
        });

        window.dbOnValue(window.dbRef(window.db, STORAGE_PATH), (snapshot) => {
            const listContainer = document.getElementById('adminSlideList');
            listContainer.innerHTML = '<h3>Daftar Slide Aktif</h3>';
            const data = snapshot.val();
            
            allSlidesGlobal = [];
            for (let id in data) { allSlidesGlobal.push({ id, ...data[id] }); }
            allSlidesGlobal.sort((a, b) => (a.order || 0) - (b.order || 0));

            allSlidesGlobal.forEach((item, index) => {
                const div = document.createElement('div');
                div.classList.add('slide-item');
                const label = item.type === 'image' ? `🖼️ Gambar` : `📝 ${item.title}`;
                
                div.innerHTML = `
                    <span><strong>${index + 1}. ${label}</strong></span>
                    <div class="controls">
                        <button class="btn-move" onclick="moveSlide(${index}, -1)" ${index === 0 ? 'disabled' : ''}>▲ Naik</button>
                        <button class="btn-move" onclick="moveSlide(${index}, 1)" ${index === allSlidesGlobal.length - 1 ? 'disabled' : ''}>▼ Turun</button>
                        <button class="btn-danger" onclick="deleteSlide('${item.id}')">Hapus</button>
                    </div>
                `;
                listContainer.appendChild(div);
            });
        });

        // FUNGSI UNTUK MENAIK-TURUNKAN URUTAN
        window.moveSlide = (currentIndex, direction) => {
            const targetIndex = currentIndex + direction;
            if (targetIndex < 0 || targetIndex >= allSlidesGlobal.length) return;

            const currentItem = allSlidesGlobal[currentIndex];
            const targetItem = allSlidesGlobal[targetIndex];

            // Tukar nilai 'order' di Firebase
            const updates = {};
            updates[STORAGE_PATH + currentItem.id + '/order'] = targetIndex;
            updates[STORAGE_PATH + targetItem.id + '/order'] = currentIndex;

            window.dbUpdate(window.dbRef(window.db), updates);
        };

        window.deleteSlide = (id) => {
            if(confirm("Hapus slide?")) window.dbRemove(window.dbRef(window.db, STORAGE_PATH + id));
        };
    }
};

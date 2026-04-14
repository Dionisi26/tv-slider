// Tunggu sampai window mendeteksi Firebase, karena Firebase diload via module
window.onload = () => {
    // Pastikan Firebase sudah ter-load sebelum mengeksekusi script
    if (!window.db) {
        console.error("Firebase gagal dimuat. Periksa koneksi internet atau konfigurasi.");
        return;
    }

    const STORAGE_PATH = 'slides/'; 

    /* =========================================
       LOGIKA UNTUK HALAMAN SLIDER (TV)
       ========================================= */
    const track = document.getElementById('sliderTrack');
    let autoPlayInterval; // Variabel global untuk timer

    if (track) {
        window.dbOnValue(window.dbRef(window.db, STORAGE_PATH), (snapshot) => {
            const data = snapshot.val();
            const slidesArray = data ? Object.values(data) : [];
            
            track.innerHTML = '';
            document.getElementById('sliderDots').innerHTML = '';

            if (slidesArray.length === 0) {
                track.innerHTML = '<div class="slide" style="background:#222;"><h1 style="color:white;">Belum ada informasi.</h1></div>';
                return;
            }

            renderSlides(slidesArray);
        });

        function renderSlides(slidesArray) {
            const dotsContainer = document.getElementById('sliderDots');
            
            slidesArray.forEach((data, index) => {
                const slide = document.createElement('div');
                slide.classList.add('slide');
                
                // Pengecekan jika ada gambar
                if (data.image && data.image.trim() !== "") {
                    slide.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${data.image}')`;
                    slide.style.backgroundSize = "cover";
                    slide.style.backgroundPosition = "center";
                } else {
                    slide.style.backgroundColor = data.color || '#333';
                }

                slide.innerHTML = `
                    <div class="slide-content">
                        <h2>${data.title}</h2>
                        <p>${data.desc}</p>
                    </div>
                `;
                track.appendChild(slide);

                const dot = document.createElement('div');
                dot.classList.add('dot');
                if (index === 0) dot.classList.add('active');
                dotsContainer.appendChild(dot);
            });

            startSliderLogic(slidesArray.length);
        }

        // FUNGSI INI YANG SEBELUMNYA HILANG DARI KODE ANDA
        function startSliderLogic(slideCount) {
            let currentIndex = 0;
            const dots = Array.from(document.getElementById('sliderDots').children);

            const updateSlider = () => {
                track.style.transform = `translateX(-${currentIndex * 100}vw)`;
                dots.forEach(d => d.classList.remove('active'));
                if(dots[currentIndex]) dots[currentIndex].classList.add('active');
            };

            const goToSlide = (index) => { currentIndex = index; updateSlider(); };
            const nextSlide = () => { currentIndex = (currentIndex === slideCount - 1) ? 0 : currentIndex + 1; updateSlider(); };
            const prevSlide = () => { currentIndex = (currentIndex === 0) ? slideCount - 1 : currentIndex - 1; updateSlider(); };

            // Event listener untuk tombol next/prev
            document.getElementById('nextBtn').onclick = () => { nextSlide(); resetAutoPlay(); };
            document.getElementById('prevBtn').onclick = () => { prevSlide(); resetAutoPlay(); };

            // Event listener untuk titik/dots
            dots.forEach((dot, index) => {
                dot.onclick = () => { goToSlide(index); resetAutoPlay(); };
            });

            // Autoplay (5 Detik)
            const startAutoPlay = () => { 
                clearInterval(autoPlayInterval);
                autoPlayInterval = setInterval(nextSlide, 5000); 
            };
            const resetAutoPlay = () => { 
                clearInterval(autoPlayInterval); 
                startAutoPlay(); 
            };
            
            startAutoPlay();
        }
    }

    /* =========================================
       LOGIKA UNTUK HALAMAN ADMIN
       ========================================= */
    const cmsForm = document.getElementById('cmsForm');
    if (cmsForm) {
        cmsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = Date.now().toString(); // Harus string untuk Firebase ID

            // Perbaikan: Pastikan elemen ada sebelum mengambil value-nya
            const slideImageEl = document.getElementById('slideImage');
            
            const newSlide = {
                title: document.getElementById('slideTitle').value,
                desc: document.getElementById('slideDesc').value,
                color: document.getElementById('slideColor').value,
                image: slideImageEl ? slideImageEl.value : "" // Aman dari error null
            };

            window.dbSet(window.dbRef(window.db, STORAGE_PATH + id), newSlide)
                .then(() => {
                    cmsForm.reset();
                    alert("Slide Berhasil dikirim ke TV!");
                })
                .catch((error) => {
                    alert("Error menyimpan: " + error.message);
                });
        });

        window.dbOnValue(window.dbRef(window.db, STORAGE_PATH), (snapshot) => {
            const listContainer = document.getElementById('adminSlideList');
            listContainer.innerHTML = '<h3>Daftar Slide Aktif</h3>';
            const data = snapshot.val();
            
            for (let id in data) {
                const item = document.createElement('div');
                item.classList.add('slide-item');
                item.innerHTML = `
                    <span><strong>${data[id].title}</strong></span>
                    <button class="btn btn-danger" onclick="deleteSlide('${id}')">Hapus</button>
                `;
                listContainer.appendChild(item);
            }
        });

        window.deleteSlide = (id) => {
            if(confirm("Hapus slide ini dari TV?")) {
                window.dbSet(window.dbRef(window.db, STORAGE_PATH + id), null);
            }
        };
    }
};

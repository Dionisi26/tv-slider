document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_PATH = 'slides/'; // Path di database Firebase

    /* =========================================
       LOGIKA UNTUK HALAMAN SLIDER (TV)
       ========================================= */
    const track = document.getElementById('sliderTrack');
    if (track) {
        // Mendengarkan perubahan data secara REAL-TIME
        window.dbOnValue(window.dbRef(window.db, STORAGE_PATH), (snapshot) => {
            const data = snapshot.val();
            const slidesArray = data ? Object.values(data) : [];
            
            // Bersihkan slider lama
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
                
                if (data.image) {
                    slide.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${data.image}')`;
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

        // ... Logika nextSlide, prevSlide, Autoplay (sama seperti sebelumnya) ...
    }

    /* =========================================
       LOGIKA UNTUK HALAMAN ADMIN
       ========================================= */
    const cmsForm = document.getElementById('cmsForm');
    if (cmsForm) {
        cmsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = Date.now(); // Gunakan timestamp sebagai ID unik
            const newSlide = {
                title: document.getElementById('slideTitle').value,
                desc: document.getElementById('slideDesc').value,
                color: document.getElementById('slideColor').value,
                image: document.getElementById('slideImage').value
            };

            // Simpan ke Firebase
            window.dbSet(window.dbRef(window.db, STORAGE_PATH + id), newSlide)
                .then(() => {
                    cmsForm.reset();
                    alert("Slide Berhasil dikirim ke TV!");
                });
        });

        // Tampilkan daftar untuk dihapus
        window.dbOnValue(window.dbRef(window.db, STORAGE_PATH), (snapshot) => {
            const listContainer = document.getElementById('adminSlideList');
            listContainer.innerHTML = '<h3>Daftar Slide Aktif</h3>';
            const data = snapshot.val();
            
            for (let id in data) {
                const item = document.createElement('div');
                item.classList.add('slide-item');
                item.innerHTML = `
                    <span>${data[id].title}</span>
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
});
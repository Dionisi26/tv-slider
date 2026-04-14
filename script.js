document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_PATH = 'slides/';

    /* =========================================
       LOGIKA UNTUK HALAMAN SLIDER (TV)
       ========================================= */
    const track = document.getElementById('sliderTrack');
    if (track) {
        window.dbOnValue(window.dbRef(window.db, STORAGE_PATH), (snapshot) => {
            const data = snapshot.val();
            const slidesArray = data ? Object.values(data) : [];
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
                
                // LOGIKA BARU: Jika ada gambar, tampilkan gambar penuh tanpa kotak teks
                if (data.image && data.image.trim() !== "") {
                    slide.style.backgroundImage = `url('${data.image}')`;
                    slide.style.backgroundSize = "contain"; // "contain" agar gambar tidak terpotong, "cover" untuk memenuhi layar
                    slide.style.backgroundRepeat = "no-repeat";
                    slide.style.backgroundPosition = "center";
                    slide.style.backgroundColor = "#000"; // Background hitam jika gambar tidak pas
                } else {
                    // Jika tidak ada gambar, tampilkan teks dengan background warna
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
            startSlider(slidesArray.length);
        }

        function startSlider(count) {
            let index = 0;
            const dots = document.querySelectorAll('.dot');
            setInterval(() => {
                index = (index + 1) % count;
                track.style.transform = `translateX(-${index * 100}vw)`;
                dots.forEach(d => d.classList.remove('active'));
                dots[index].classList.add('active');
            }, 5000); // Ganti slide setiap 5 detik
        }
    }

    /* =========================================
       LOGIKA UNTUK HALAMAN ADMIN
       ========================================= */
    const cmsForm = document.getElementById('cmsForm');
    if (cmsForm) {
        cmsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = Date.now();
            const type = document.getElementById('infoType').value;
            
            const newSlide = {
                type: type,
                title: type === 'text' ? document.getElementById('slideTitle').value : "",
                desc: type === 'text' ? document.getElementById('slideDesc').value : "",
                color: type === 'text' ? document.getElementById('slideColor').value : "#000000",
                image: type === 'image' ? document.getElementById('slideImage').value : ""
            };

            window.dbSet(window.dbRef(window.db, STORAGE_PATH + id), newSlide)
                .then(() => {
                    cmsForm.reset();
                    alert("Berhasil dikirim ke TV!");
                }).catch(err => alert("Gagal: " + err));
        });

        // Tampilkan daftar
        window.dbOnValue(window.dbRef(window.db, STORAGE_PATH), (snapshot) => {
            const listContainer = document.getElementById('adminSlideList');
            listContainer.innerHTML = '<h3>Daftar Slide Aktif</h3>';
            const data = snapshot.val();
            for (let id in data) {
                const item = document.createElement('div');
                item.classList.add('slide-item');
                const label = data[id].type === 'image' ? "🖼️ Gambar" : `📝 ${data[id].title}`;
                item.innerHTML = `
                    <span>${label}</span>
                    <button class="btn btn-danger" onclick="deleteSlide('${id}')">Hapus</button>
                `;
                listContainer.appendChild(item);
            }
        });

        window.deleteSlide = (id) => {
            if(confirm("Hapus slide ini?")) {
                window.dbSet(window.dbRef(window.db, STORAGE_PATH + id), null);
            }
        };
    }
});

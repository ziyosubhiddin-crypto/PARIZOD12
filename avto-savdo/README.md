# Avto Savdo Pro — Desktop Avtomobil Savdosi Platformasi

O'zbekiston avtomobil bozori uchun maxsus ishlab chiqilgan, zamonaviy va to'liq funksional avto-savdo web-dasturi.

## 🚀 Asosiy imkoniyatlar:
1. **Mashinalar vitrinasi (Showroom)**:
   - Chevrolet (Tracker 2, Gentra, Cobalt, Onix), BYD (Song Plus), Kia (K5), Mercedes-Benz, Hyundai va boshqa mashhur modellar.
   - Narxlar, yili, probegi, yoqilg'i turi, uzatma qutisi (avtomat/mexanika) bo'yicha saralash va filtrlar.
   - Kataklar (Grid) va Ro'yxat (List) ko'rinishlari.
2. **Valyuta almashtirish**:
   - Bir tugma orqali narxlarni **$ USD** yoki **O'zbek so'mi (UZS)** ko'rinishida hisoblash.
3. **Mashina sotish (Yangi e'lon berish)**:
   - Kompyuterdan rasm yuklash (File Upload) yoki rasm havolasini kiritish.
   - Narx, texnik holat, telefon raqami va ma'lumotlarni kiritib, 1 daqiqada vitrinaga joylash.
   - Barcha ma'lumotlar avtomatik `localStorage`da saqlanadi.
4. **Narx taklif qilish (Savdolashish / Torg)**:
   - Xaridor to'g'ridan-to'g'ri o'z narx taklifini kiritib sotuvchiga yuborishi mumkin.
5. **Kredit va Lizing Kalkulyatori**:
   - Boshlang'ich to'lov (10% - 80%), kredit muddati (12 - 60 oy) va foiz stavkasi asosida aniq oylik to'lov va umumiy summani hisoblaydi.
6. **Bozor Tahlili & Statistika**:
   - O'zbekiston avtomobil bozoridagi ulushlar, o'rtacha narxlar va xavfsiz oldi-sotdi bo'yicha maslahatlar.
7. **Tun / Kun rejimi (Dark & Light Theme)**.

## 📂 Fayllar strukturasi:
- `index.html` — Dasturning asosiy strukturasi
- `styles.css` — Zamonaviy avtomobil salon dizayni, glassmorphism va animatsiyalar
- `app.js` — Barcha dinamik logikalar, filtrlar, kalkulyator va saqlash tizimi
- `data.js` — Boshlang'ich avtomobillar bazasi
- `start_app.bat` — Windows tizimida bir bosishda ishga tushirish skripti

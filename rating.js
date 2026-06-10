import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlzYqLEcy1OzZMcGOlidQRr8tNdZNXsSk",
  authDomain: "zdravie-plus-5193f.firebaseapp.com", 
  projectId: "zdravie-plus-5193f",
  storageBucket: "zdravie-plus-5193f.firebasestorage.app",
  messagingSenderId: "21608089094",
  appId: "1:21608089094:web:53b5f9fc60d51ae96ba587"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const docRef = doc(db, "recenzia", "celkove");

const starButtons = document.querySelectorAll('.star-btn');
const starsContainer = document.getElementById('stars-container');
const ratingText = document.getElementById('rating-text');
let aktualnyPriemer = 0;
let celkovyPocetHlasov = 0;
let isSubmitting = false;

// Sledovanie zmien v reálnom čase
onSnapshot(docRef, (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.data();
    celkovyPocetHlasov = data.pocetHlasov || 0;
    // Prevod na Number pre istotu, ak by Firestore vrátil iný typ
    aktualnyPriemer = (celkovyPocetHlasov > 0) ? (Number(data.sucetHviezd) / Number(celkovyPocetHlasov)) : 0;
    
    if (celkovyPocetHlasov > 0) {
        ratingText.innerText = `${aktualnyPriemer.toFixed(1)} / 5 (${celkovyPocetHlasov} ${celkovyPocetHlasov === 1 ? 'hodnotenie' : 'hodnotení'})`;
    } else {
        ratingText.innerText = "Zatiaľ nikto nehodnotil. Buďte prvý!";
    }
    
    aktualizujHviezdy(Math.round(aktualnyPriemer));
  } else {
    console.log("Dokument 'recenzia/celkove' zatiaľ v DB neexistuje. Čakám na prvý hlas.");
    ratingText.innerText = "Zatiaľ nikto nehodnotil. Buďte prvý!";
    aktualizujHviezdy(0);
  }
}, (error) => {
  // Ak tu uvidíš chybu v konzole, skopíruj mi jej kód
  console.error("CHYBA PRI NAČÍTANÍ:", error.code, error.message);
  ratingText.innerText = "Chyba pri načítaní dát z databázy.";
});

function aktualizujHviezdy(aktivne) {
  if (!starsContainer) return;
  // Hľadáme i (pred transformáciou) aj svg (po transformácii Lucide)
  const stars = starsContainer.querySelectorAll('i[data-lucide="star"], svg[data-lucide="star"]');
  const zaokruhlene = Math.round(aktivne);
  
  stars.forEach((star, index) => {
    if (index < zaokruhlene) {
      star.classList.add('text-yellow-500', 'fill-yellow-500');
      star.classList.remove('text-gray-300');
    } else {
      star.classList.remove('text-yellow-500', 'fill-yellow-500');
      star.classList.add('text-gray-300');
    }
  });
}

// Interná funkcia na hlasovanie
const odoslatHlas = async (pocet) => {
  if (isSubmitting) return;

  // Zabránenie viacnásobnému hlasovaniu (jednoduchá ochrana cez localStorage)
  if (localStorage.getItem('uz_hlasoval')) {
    // Vždy aktualizujeme text a hviezdy na aktuálny stav z DB pri pokuse o hlasovanie
    aktualizujHviezdy(Math.round(aktualnyPriemer));
    ratingText.innerText = celkovyPocetHlasov > 0 
        ? `${aktualnyPriemer.toFixed(1)} / 5 (${celkovyPocetHlasov} ${celkovyPocetHlasov === 1 ? 'hodnotenie' : 'hodnotení'})`
        : "Zatiaľ nikto nehodnotil. Buďte prvý!";
        
    alert('Už ste hlasovali. Ďakujeme!');
    return;
  }

  isSubmitting = true;
  const originalText = ratingText.innerText;
  ratingText.innerText = "Odosielam hlas...";

  try {
    // setDoc s merge: true vytvorí dokument, ak neexistuje
    await setDoc(docRef, {
      pocetHlasov: increment(1),
      sucetHviezd: increment(pocet)
    }, { merge: true });
    
    console.log(`Hlas odoslaný: ${pocet} hviezd`);
    
    // Vizuálna spätná väzba
    aktualizujHviezdy(pocet);
    localStorage.setItem('uz_hlasoval', 'true');
    isSubmitting = false; 
    alert('Vďaka za hodnotenie!');    
    
  } catch (error) {
    // Toto ti v konzole (F12) presne povie, čo je zle
    console.error("FIREBASE ERROR:", error.code);
    console.error("Full message:", error.message);
    
    // Resetujeme hviezdy na pôvodný priemer, keďže hlasovanie zlyhalo
    ratingText.innerText = originalText;
    aktualizujHviezdy(Math.round(aktualnyPriemer));
    isSubmitting = false;

    if (error.code === 'permission-denied') {
      alert('Chyba: Prístup zamietnutý. Skontrolujte pravidlá alebo či dokument v DB existuje.');
    } else if (error.code === 'not-found') {
      alert('Chyba: Dokument "recenzia/celkove" nebol v databáze nájdený.');
    } else {
      alert('Hlasovanie zlyhalo. Skúste to neskôr. (Chyba: ' + error.code + ')');
    }
  }
};

// Event Listenery pre tlačidlá
starButtons.forEach(btn => {
  // Kliknutie
  btn.addEventListener('click', () => {
    const rating = parseInt(btn.getAttribute('data-rating'));
    odoslatHlas(rating);
  });

  // Hover efekt (vstúpenie myšou)
  btn.addEventListener('mouseenter', () => {
    if (!localStorage.getItem('uz_hlasoval')) {
      aktualizujHviezdy(parseInt(btn.getAttribute('data-rating')));
    }
  });
});

// Reset hviezd pri opustení kontajnera (ak ešte nehlasoval)
starsContainer.addEventListener('mouseleave', () => {
    if (!localStorage.getItem('uz_hlasoval')) {
        aktualizujHviezdy(Math.round(aktualnyPriemer));
    }
});
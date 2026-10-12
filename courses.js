// Banen die bij de eerste start in de database worden gezet.
// Gegevens: gele tee heren. Controleer CR/slope op de officiële scorekaart van de club.
export const SEED_COURSES = [
  { id: "the-international", name: "The International",
    par: [5,4,5,3,4,4,3,5,4, 4,4,4,3,4,5,4,3,5],
    si:  [17,13,7,11,15,9,3,5,1, 6,18,4,16,14,2,8,12,10],
    tees: [{ name: "Geel", cr: 73.2, slope: 137 }] },
  { id: "de-goyer", name: "De Goyer (North)",
    par: [4,3,4,5,3,4,5,4,4, 4,3,4,5,3,4,4,5,4],
    si:  [9,15,7,1,17,11,3,5,13, 14,18,4,2,16,8,12,6,10],
    tees: [{ name: "Geel (59)", cr: 73.4, slope: 141 }] },
  { id: "bernardus", name: "Bernardus",
    par: [4,4,4,5,4,3,5,3,4, 4,4,5,3,4,4,4,3,5],
    si:  [11,5,13,3,9,17,1,15,7, 14,6,10,16,2,12,8,18,4],
    tees: [{ name: "Geel (60)", cr: 72.9, slope: 139 }] },
  { id: "la-reserva-sotogrande", name: "La Reserva Sotogrande",
    par: [4,5,4,4,3,5,3,4,4, 4,4,4,5,4,3,5,3,4],
    si:  [10,5,9,3,14,12,18,1,16, 8,6,13,11,2,7,15,17,4],
    tees: [{ name: "Geel", cr: 73.0, slope: 141 }] },
  { id: "de-haagsche", name: "De Haagsche",
    par: [5,4,4,3,5,4,4,3,4, 5,4,3,4,4,4,4,3,5],
    si:  [13,7,5,11,15,1,9,17,3, 12,6,16,2,10,4,14,18,8],
    tees: [{ name: "Geel", cr: 72.1, slope: 138 }] },
  { id: "finca-cortesin", name: "Finca Cortesín",
    par: [4,3,5,4,5,3,4,5,4, 3,5,3,4,4,4,4,3,5],
    si:  [9,7,3,15,11,13,1,5,17, 10,2,6,16,14,4,12,18,8],
    tees: [{ name: "Geel", cr: 72.0, slope: 138 }] }
];

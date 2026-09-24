export type VocabularyEntry = {
  id: string;
  spanish: string;
  correct: string;
  distractors: readonly [string, string];
};

/** Curated local vocabulary: one unambiguous translation and two distinct nouns/adjectives. */
const starter: readonly VocabularyEntry[] = [
  { id: 'house', spanish: 'Casa', correct: 'House', distractors: ['Car', 'Book'] },
  { id: 'dog', spanish: 'Perro', correct: 'Dog', distractors: ['Cat', 'Bird'] },
  { id: 'water', spanish: 'Agua', correct: 'Water', distractors: ['Milk', 'Juice'] },
  { id: 'sun', spanish: 'Sol', correct: 'Sun', distractors: ['Moon', 'Star'] },
  { id: 'book', spanish: 'Libro', correct: 'Book', distractors: ['Chair', 'Table'] },
  { id: 'school', spanish: 'Escuela', correct: 'School', distractors: ['Garden', 'Store'] },
  { id: 'food', spanish: 'Comida', correct: 'Food', distractors: ['Water', 'Music'] },
  { id: 'friend', spanish: 'Amigo', correct: 'Friend', distractors: ['Guest', 'Chef'] },
  { id: 'moon', spanish: 'Luna', correct: 'Moon', distractors: ['Sun', 'Cloud'] },
  { id: 'cold', spanish: 'Frío', correct: 'Cold', distractors: ['Hot', 'Warm'] },
];

export type VocabularyLevel = { id: string; title: string; difficulty: string; indices: number[] };
// Editorial learning groups, not certified CEFR levels. IDs remain stable across releases.
const groups = [
  {
    "id": "greetings",
    "title": "Primeros encuentros",
    "difficulty": "Inicial",
    "words": [
      [
        "Hola",
        "Hello"
      ],
      [
        "Adiós",
        "Goodbye"
      ],
      [
        "Gracias",
        "Thanks"
      ],
      [
        "Por favor",
        "Please"
      ],
      [
        "Sí",
        "Yes"
      ],
      [
        "No",
        "No"
      ],
      [
        "Bienvenido",
        "Welcome"
      ],
      [
        "Lo siento",
        "Sorry"
      ],
      [
        "Buenos días",
        "Good morning"
      ],
      [
        "Buenas noches (al despedirse)",
        "Good night"
      ]
    ]
  },
  {
    "id": "family",
    "title": "Personas y familia",
    "difficulty": "Inicial",
    "words": [
      [
        "Madre",
        "Mother"
      ],
      [
        "Padre",
        "Father"
      ],
      [
        "Hermana",
        "Sister"
      ],
      [
        "Hermano",
        "Brother"
      ],
      [
        "Hija",
        "Daughter"
      ],
      [
        "Hijo",
        "Son"
      ],
      [
        "Bebé",
        "Baby"
      ],
      [
        "Niño",
        "Child"
      ],
      [
        "Mujer",
        "Woman"
      ],
      [
        "Hombre",
        "Man"
      ]
    ]
  },
  {
    "id": "home",
    "title": "Dentro de casa",
    "difficulty": "Inicial",
    "words": [
      [
        "Puerta",
        "Door"
      ],
      [
        "Ventana",
        "Window"
      ],
      [
        "Mesa",
        "Table"
      ],
      [
        "Silla",
        "Chair"
      ],
      [
        "Cama",
        "Bed"
      ],
      [
        "Cocina",
        "Kitchen"
      ],
      [
        "Baño",
        "Bathroom"
      ],
      [
        "Habitación",
        "Room"
      ],
      [
        "Piso (superficie)",
        "Floor"
      ],
      [
        "Pared",
        "Wall"
      ]
    ]
  },
  {
    "id": "meals",
    "title": "A la mesa",
    "difficulty": "Cotidiano",
    "words": [
      [
        "Pan",
        "Bread"
      ],
      [
        "Leche",
        "Milk"
      ],
      [
        "Arroz",
        "Rice"
      ],
      [
        "Huevo",
        "Egg"
      ],
      [
        "Manzana",
        "Apple"
      ],
      [
        "Carne",
        "Meat"
      ],
      [
        "Queso",
        "Cheese"
      ],
      [
        "Café",
        "Coffee"
      ],
      [
        "Azúcar",
        "Sugar"
      ],
      [
        "Sal",
        "Salt"
      ]
    ]
  },
  {
    "id": "city",
    "title": "Por la ciudad",
    "difficulty": "Cotidiano",
    "words": [
      [
        "Calle",
        "Street"
      ],
      [
        "Carretera",
        "Road"
      ],
      [
        "Carro",
        "Car"
      ],
      [
        "Autobús",
        "Bus"
      ],
      [
        "Tren",
        "Train"
      ],
      [
        "Tienda",
        "Store"
      ],
      [
        "Hospital",
        "Hospital"
      ],
      [
        "Parque",
        "Park"
      ],
      [
        "Puente",
        "Bridge"
      ],
      [
        "Estación",
        "Station"
      ]
    ]
  },
  {
    "id": "time",
    "title": "Tiempo y rutina",
    "difficulty": "Cotidiano",
    "words": [
      [
        "Hoy",
        "Today"
      ],
      [
        "Mañana (el día siguiente)",
        "Tomorrow"
      ],
      [
        "Ayer",
        "Yesterday"
      ],
      [
        "Semana",
        "Week"
      ],
      [
        "Mes",
        "Month"
      ],
      [
        "Año",
        "Year"
      ],
      [
        "Hora",
        "Hour"
      ],
      [
        "Minuto",
        "Minute"
      ],
      [
        "Temprano",
        "Early"
      ],
      [
        "Tarde (con retraso)",
        "Late"
      ]
    ]
  },
  {
    "id": "actions",
    "title": "Acciones diarias",
    "difficulty": "Cotidiano",
    "words": [
      [
        "Comer",
        "Eat"
      ],
      [
        "Beber",
        "Drink"
      ],
      [
        "Dormir",
        "Sleep"
      ],
      [
        "Caminar",
        "Walk"
      ],
      [
        "Correr",
        "Run"
      ],
      [
        "Leer",
        "Read"
      ],
      [
        "Escribir",
        "Write"
      ],
      [
        "Hablar",
        "Speak"
      ],
      [
        "Escuchar",
        "Listen"
      ],
      [
        "Trabajar",
        "Work"
      ]
    ]
  },
  {
    "id": "descriptions",
    "title": "Describe tu mundo",
    "difficulty": "En expansión",
    "words": [
      [
        "Grande",
        "Big"
      ],
      [
        "Pequeño",
        "Small"
      ],
      [
        "Rápido",
        "Fast"
      ],
      [
        "Lento",
        "Slow"
      ],
      [
        "Fácil",
        "Easy"
      ],
      [
        "Difícil",
        "Difficult"
      ],
      [
        "Limpio",
        "Clean"
      ],
      [
        "Sucio",
        "Dirty"
      ],
      [
        "Lleno",
        "Full"
      ],
      [
        "Vacío",
        "Empty"
      ]
    ]
  },
  {
    "id": "travel",
    "title": "De viaje",
    "difficulty": "En expansión",
    "words": [
      [
        "Viaje",
        "Trip"
      ],
      [
        "Maleta",
        "Suitcase"
      ],
      [
        "Pasaporte",
        "Passport"
      ],
      [
        "Aeropuerto",
        "Airport"
      ],
      [
        "Vuelo",
        "Flight"
      ],
      [
        "Billete (de viaje)",
        "Ticket"
      ],
      [
        "Equipaje",
        "Luggage"
      ],
      [
        "Mapa",
        "Map"
      ],
      [
        "Destino",
        "Destination"
      ],
      [
        "Reserva (de hotel)",
        "Reservation"
      ]
    ]
  },
  {
    "id": "feelings",
    "title": "Cómo te sientes",
    "difficulty": "En expansión",
    "words": [
      [
        "Feliz",
        "Happy"
      ],
      [
        "Triste",
        "Sad"
      ],
      [
        "Cansado",
        "Tired"
      ],
      [
        "Enfadado",
        "Angry"
      ],
      [
        "Preocupado",
        "Worried"
      ],
      [
        "Orgulloso",
        "Proud"
      ],
      [
        "Sorprendido",
        "Surprised"
      ],
      [
        "Tranquilo",
        "Calm"
      ],
      [
        "Solitario",
        "Lonely"
      ],
      [
        "Agradecido",
        "Grateful"
      ]
    ]
  },
  {
    "id": "ideas",
    "title": "Ideas y decisiones",
    "difficulty": "En expansión",
    "words": [
      [
        "Elegir",
        "Choose"
      ],
      [
        "Decidir",
        "Decide"
      ],
      [
        "Mejorar",
        "Improve"
      ],
      [
        "Recordar",
        "Remember"
      ],
      [
        "Olvidar",
        "Forget"
      ],
      [
        "Explicar",
        "Explain"
      ],
      [
        "Aprender",
        "Learn"
      ],
      [
        "Comprender",
        "Understand"
      ],
      [
        "Comparar",
        "Compare"
      ],
      [
        "Resolver",
        "Solve"
      ]
    ]
  }
];

export const vocabulary: readonly VocabularyEntry[] = [...starter, ...groups.flatMap(group =>
  group.words.map(([spanish, correct], index) => ({
    id: correct.toLowerCase().replace(/ /g, '-'), spanish, correct,
    distractors: [group.words[(index + 3) % group.words.length][1], group.words[(index + 7) % group.words.length][1]] as const,
  })))];
export const levels: readonly VocabularyLevel[] = [
  { id: 'essentials', title: 'Primeras palabras', difficulty: 'Inicial', indices: starter.map((_, i) => i) },
  ...groups.map((group, i) => ({ id: group.id, title: group.title, difficulty: group.difficulty,
    indices: group.words.map((_, j) => starter.length + i * 10 + j) })),
];

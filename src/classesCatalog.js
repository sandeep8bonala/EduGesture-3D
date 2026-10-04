/* ==========================================================================
   EduGester - Interactive Classes Catalog & School Curriculum (Classes 1-10)
   ========================================================================== */

// ------------------------------------------------------------------------------
// FRONTEND CURRICULUM DATA (Classes 1-10 -> Subjects -> Chapters -> 3D Models)
// ------------------------------------------------------------------------------
export const CURRICULUM_DATA = {
  "1": {
    classNumber: "1",
    title: "Class 1",
    desc: "Elementary Foundations & Visual Science",
    icon: "🌱",
    subjects: {
      "Science": {
        icon: "🔬",
        chapters: [
          { id: "c1-sci-1", chapterNumber: 1, title: "Living & Non-Living Things", desc: "Discover what makes organisms alive through interactive 3D models.", model: "heart" },
          { id: "c1-sci-2", chapterNumber: 2, title: "Our Solar System & Sun", desc: "Look up at the Sun, Earth, and Moon in 3D space.", model: "solar" },
          { id: "c1-sci-3", chapterNumber: 3, title: "Plant Life & Seeds", desc: "Explore plant cellular structure and DNA building blocks.", model: "dna" }
        ]
      },
      "Mathematics": {
        icon: "📐",
        chapters: [
          { id: "c1-math-1", chapterNumber: 1, title: "Basic Shapes & Polyhedrons", desc: "Rotate 3D shapes, cubes, spheres, and crystal polyhedrons.", model: "polyhedron" }
        ]
      }
    }
  },
  "2": {
    classNumber: "2",
    title: "Class 2",
    desc: "Nature, Environment & Earth Basics",
    icon: "🌍",
    subjects: {
      "Science": {
        icon: "🔬",
        chapters: [
          { id: "c2-sci-1", chapterNumber: 1, title: "Day and Night Cycle", desc: "Observe Earth rotating around the Sun in real time.", model: "solar" },
          { id: "c2-sci-2", chapterNumber: 2, title: "Human Body Parts", desc: "Introduction to vital organs: Heart & Lungs.", model: "heart" }
        ]
      },
      "Mathematics": {
        icon: "📐",
        chapters: [
          { id: "c2-math-1", chapterNumber: 1, title: "3D Geometric Solids", desc: "Explore faces, edges, and vertices of 3D solids.", model: "polyhedron" }
        ]
      }
    }
  },
  "3": {
    classNumber: "3",
    title: "Class 3",
    desc: "Introduction to Matter & Space",
    icon: "🚀",
    subjects: {
      "Science": {
        icon: "🔬",
        chapters: [
          { id: "c3-sci-1", chapterNumber: 1, title: "Earth, Moon and Stars", desc: "Planetary orbits and lunar phases visualizer.", model: "solar" },
          { id: "c3-sci-2", chapterNumber: 2, title: "States of Matter & Molecules", desc: "Atom clusters and molecular particle movement.", model: "atom" }
        ]
      },
      "Computer Science": {
        icon: "💻",
        chapters: [
          { id: "c3-cs-1", chapterNumber: 1, title: "Robotics & Machine Logic", desc: "Interactive robotic arm joint controller.", model: "robot" }
        ]
      }
    }
  },
  "4": {
    classNumber: "4",
    title: "Class 4",
    desc: "Human Systems & Environmental Science",
    icon: "🫀",
    subjects: {
      "Science": {
        icon: "🔬",
        chapters: [
          { id: "c4-sci-1", chapterNumber: 1, title: "Human Circulatory System", desc: "Blood flow and heart chamber contractions.", model: "heart" },
          { id: "c4-sci-2", chapterNumber: 2, title: "Solar System Neighbors", desc: "Saturn rings, Mars, and inner planets.", model: "solar" }
        ]
      }
    }
  },
  "5": {
    classNumber: "5",
    title: "Class 5",
    desc: "Advanced Primary Science & Energy",
    icon: "⚡",
    subjects: {
      "Science": {
        icon: "🔬",
        chapters: [
          { id: "c5-sci-1", chapterNumber: 1, title: "The Building Blocks of Life", desc: "DNA helix structure and genetic strands.", model: "dna" },
          { id: "c5-sci-2", chapterNumber: 2, title: "Simple Machines & Mechanics", desc: "Mechanical robotic arm kinematics and levers.", model: "robot" }
        ]
      }
    }
  },
  "6": {
    classNumber: "6",
    title: "Class 6",
    desc: "Middle School Science & Geometry",
    icon: "🔬",
    subjects: {
      "Science": {
        icon: "🔬",
        chapters: [
          { id: "c6-sci-1", chapterNumber: 1, title: "Components of Food & Cells", desc: "Cellular structures and molecular bases.", model: "dna" },
          { id: "c6-sci-2", chapterNumber: 2, title: "Motion & Measurement", desc: "Orbital speed and rotational kinematics.", model: "solar" }
        ]
      },
      "Physics": {
        icon: "⚡",
        chapters: [
          { id: "c6-phys-1", chapterNumber: 1, title: "Light, Shadows & Reflections", desc: "Optical rays and orbital light trails.", model: "atom" }
        ]
      }
    }
  },
  "7": {
    classNumber: "7",
    title: "Class 7",
    desc: "Organisms, Chemistry & Optics",
    icon: "🧪",
    subjects: {
      "Science": {
        icon: "🔬",
        chapters: [
          { id: "c7-sci-1", chapterNumber: 1, title: "Respiration in Organisms", desc: "Oxygenation cycle and cardiac muscle pulse.", model: "heart" }
        ]
      },
      "Chemistry": {
        icon: "🧪",
        chapters: [
          { id: "c7-chem-1", chapterNumber: 1, title: "Acids, Bases & Atoms", desc: "Atomic nucleus and electron orbital shells.", model: "atom" },
          { id: "c7-chem-2", chapterNumber: 2, title: "Chemical Bonding & Crystals", desc: "Polyhedron crystal lattice structures.", model: "polyhedron" }
        ]
      }
    }
  },
  "8": {
    classNumber: "8",
    title: "Class 8",
    desc: "Cell Biology, Solar System & Mechanics",
    icon: "⚛️",
    subjects: {
      "Biology": {
        icon: "🧬",
        chapters: [
          { id: "c8-bio-1", chapterNumber: 1, title: "Cell Structure & Functions", desc: "Dissect organelle bonds and DNA double helix.", model: "dna" },
          { id: "c8-bio-2", chapterNumber: 2, title: "Human Reproduction & Growth", desc: "Genetic chromosome pair structure.", model: "dna" }
        ]
      },
      "Physics": {
        icon: "⚡",
        chapters: [
          { id: "c8-phys-1", chapterNumber: 1, title: "Stars & Solar System", desc: "Gravitational orbits, Saturn rings and Moon.", model: "solar" },
          { id: "c8-phys-2", chapterNumber: 2, title: "Force, Pressure & Friction", desc: "Pneumatic robotic claw kinematics.", model: "robot" }
        ]
      }
    }
  },
  "9": {
    classNumber: "9",
    title: "Class 9",
    desc: "High School Fundamentals: Atoms, Cells & Motion",
    icon: "📐",
    subjects: {
      "Biology": {
        icon: "🧬",
        chapters: [
          { id: "c9-bio-1", chapterNumber: 1, title: "The Fundamental Unit of Life", desc: "Cellular organelle matrix and DNA strand.", model: "dna" },
          { id: "c9-bio-2", chapterNumber: 2, title: "Tissues & Organ Systems", desc: "Cardiac tissue structure and aortic flow.", model: "heart" }
        ]
      },
      "Chemistry": {
        icon: "🧪",
        chapters: [
          { id: "c9-chem-1", chapterNumber: 1, title: "Atoms and Molecules", desc: "Quantum Rutherford-Bohr atom model.", model: "atom" },
          { id: "c9-chem-2", chapterNumber: 2, title: "Structure of the Atom", desc: "Proton-neutron nucleus & electron orbitals.", model: "atom" }
        ]
      },
      "Physics": {
        icon: "⚡",
        chapters: [
          { id: "c9-phys-1", chapterNumber: 1, title: "Gravitation & Orbits", desc: "Keplerian planetary orbits and Moon lock.", model: "solar" }
        ]
      }
    }
  },
  "10": {
    classNumber: "10",
    title: "Class 10",
    desc: "Board Curriculum: Life Processes, Genetics & Quantum Optics",
    icon: "🎓",
    subjects: {
      "Biology": {
        icon: "🧬",
        chapters: [
          { id: "c10-bio-1", chapterNumber: 1, title: "Life Processes", desc: "Explore the structure and functioning of the human heart using an interactive 3D model.", model: "heart" },
          { id: "c10-bio-2", chapterNumber: 2, title: "Control and Coordination", desc: "Neural signaling and brain impulse network.", model: "robot" },
          { id: "c10-bio-3", chapterNumber: 3, title: "How Do Organisms Reproduce?", desc: "DNA replication and cellular division strands.", model: "dna" },
          { id: "c10-bio-4", chapterNumber: 4, title: "Heredity & Evolution", desc: "Base pair genetics and double helix chirality.", model: "dna" },
          { id: "c10-bio-5", chapterNumber: 5, title: "Human Eye & Vision", desc: "Interactive 3D model coming soon.", model: "coming-soon" },
          { id: "c10-bio-6", chapterNumber: 6, title: "Our Environment", desc: "Ecosystem balance & planetary orbits.", model: "solar" }
        ]
      },
      "Science": {
        icon: "🔬",
        chapters: [
          { id: "c10-sci-1", chapterNumber: 1, title: "Life Processes & Circulation", desc: "Explore the structure and functioning of the human heart using an interactive 3D model.", model: "heart" },
          { id: "c10-sci-2", chapterNumber: 2, title: "Chemical Reactions & Atoms", desc: "Quantum Rutherford-Bohr atom model.", model: "atom" },
          { id: "c10-sci-3", chapterNumber: 3, title: "Electricity & Magnetism", desc: "Atomic electron orbital shells and currents.", model: "atom" }
        ]
      },
      "Mathematics": {
        icon: "📐",
        chapters: [
          { id: "c10-math-1", chapterNumber: 1, title: "Surface Areas and Volumes", desc: "3D polyhedrons, spheres, and cylinders.", model: "polyhedron" }
        ]
      },
      "Physics": {
        icon: "⚡",
        chapters: [
          { id: "c10-phys-1", chapterNumber: 1, title: "Electricity & Magnetism", desc: "Quantum atomic electron shells and currents.", model: "atom" },
          { id: "c10-phys-2", chapterNumber: 2, title: "Light - Reflection & Refraction", desc: "Polyhedron crystal geometry optics.", model: "polyhedron" }
        ]
      },
      "Chemistry": {
        icon: "🧪",
        chapters: [
          { id: "c10-chem-1", chapterNumber: 1, title: "Carbon & Its Compounds", desc: "Buckyball carbon lattice & crystal polyhedrons.", model: "polyhedron" },
          { id: "c10-chem-2", chapterNumber: 2, title: "Periodic Classification of Elements", desc: "Atomic electron orbital shells.", model: "atom" }
        ]
      },
      "Social Science": {
        icon: "🌍",
        chapters: [
          { id: "c10-sst-1", chapterNumber: 1, title: "Resource Development & Geography", desc: "Global Earth and planetary topography.", model: "solar" }
        ]
      },
      "Computer Science": {
        icon: "💻",
        chapters: [
          { id: "c10-cs-1", chapterNumber: 1, title: "AI, Kinematics & Robotics", desc: "Robotic arm kinematics & gripper joints.", model: "robot" }
        ]
      }
    }
  }
};

// ------------------------------------------------------------------------------
// EXISTING SUBJECT CLASSES CATALOG (RETAINED FOR STANDALONE CATALOG VIEW)
// ------------------------------------------------------------------------------
export const SUBJECT_CLASSES = [
  {
    id: 'astro-101',
    title: '3D Solar System & Planetary Orbits',
    category: 'astronomy',
    icon: '🪐',
    modelType: 'solar',
    desc: 'Explore planet sizes, gravitational rotation, Earth Moon orbit, and Saturn ring dynamics in 3D.',
    level: 'Beginner',
    duration: '45 mins',
    rating: '4.9 ★',
  },
  {
    id: 'bio-201',
    title: 'DNA Double Helix & Base Pair Genetics',
    category: 'biology',
    icon: '🧬',
    modelType: 'dna',
    desc: 'Dissect Adenine, Thymine, Cytosine, and Guanine nucleotide bonds with 3D rotation.',
    level: 'Intermediate',
    duration: '35 mins',
    rating: '5.0 ★',
  },
  {
    id: 'phys-301',
    title: 'Quantum Rutherford-Bohr Atom Model',
    category: 'chemistry',
    icon: '⚛️',
    modelType: 'atom',
    desc: 'Observe proton-neutron clusters and high-speed electron orbital shells with light trails.',
    level: 'Advanced',
    duration: '40 mins',
    rating: '4.9 ★',
  },
  {
    id: 'geom-401',
    title: 'Crystal Polyhedrons & Buckyball Lattice',
    category: 'geometry',
    icon: '💎',
    modelType: 'polyhedron',
    desc: 'Rotate icosahedrons, count vertex nodes, and toggle wireframe lattice structures.',
    level: 'All Levels',
    duration: '30 mins',
    rating: '4.8 ★',
  },
  {
    id: 'bio-501',
    title: 'Human Heart Anatomy & Chamber Circulation',
    category: 'biology',
    icon: '🫀',
    modelType: 'heart',
    desc: 'Examine aorta arches, pulmonary arteries, and heartbeat muscle contractions in real-time.',
    level: 'Intermediate',
    duration: '50 mins',
    rating: '4.9 ★',
  },
  {
    id: 'mech-601',
    title: 'Robotic Arm Kinematics & Mechanical Grippers',
    category: 'geometry',
    icon: '🤖',
    modelType: 'robot',
    desc: 'Control robotic shoulder joints, elbow links, and pneumatic claw grippers using hand gestures.',
    level: 'Advanced',
    duration: '45 mins',
    rating: '5.0 ★',
  },
];

export function renderClassesGrid(container, onLaunchCallback, activeFilter = 'all') {
  if (!container) return;

  container.innerHTML = '';

  const filtered = activeFilter === 'all' 
    ? SUBJECT_CLASSES 
    : SUBJECT_CLASSES.filter(c => c.category === activeFilter);

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'class-card';
    card.innerHTML = `
      <div class="class-card-thumb">
        ${item.icon}
      </div>
      <div class="class-card-body">
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
        <button class="btn btn-primary btn-sm w-full btn-launch-subject" data-model="${item.modelType}" data-title="${item.title}">
          Launch 3D Session &rarr;
        </button>
        <div class="class-meta-info">
          <span>${item.level}</span>
          <span>⏱ ${item.duration}</span>
          <span>${item.rating}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-launch-subject').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modelType = e.currentTarget.dataset.model;
      const title = e.currentTarget.dataset.title;
      if (onLaunchCallback) {
        onLaunchCallback(modelType, title);
      }
    });
  });
}

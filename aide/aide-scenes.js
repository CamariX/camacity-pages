export const chapters = [
  {
    title: "Rejoindre", duration: 19, audio: "./aide-solara-rejoindre.mp3", audioDuration: 18.4895,
    narration: "Bienvenue à Cama City. Ici, les viewers construisent un village ensemble. Ouvre le panneau Cama City sur la chaîne. Si Twitch te le demande, partage ton identité. Crée ton personnage, puis va au dépôt pour rejoindre les forestiers, ou à l’atelier pour rejoindre les menuisiers.",
    shots: [
      {at:0, site:"village", zoom:1150, tab:"Panneau Twitch", rows:["Ouvrir CamaCity","Partager mon identité Twitch","Créer mon personnage"], caption:"Ouvre CamaCity sur la chaîne. Partage ton identité Twitch si le panneau te le demande, puis crée ton personnage."},
      {at:9, site:"siege-forestier", from:"village", tab:"Aller → Interagir", rows:["Rejoindre les Forestiers","Alternative · Rejoindre les Menuisiers"], caption:"Va au bâtiment des Forestiers ou à la Menuiserie, puis clique sur Rejoindre. Le forestier récolte le bois. Le menuisier en fait des planches."},
    ],
  },
  {
    title:"Travailler", duration:28, audio: "./aide-solara-travailler.mp3", audioDuration: 19.98025,
    narration:"Dans le panneau, appuie sur le bouton Aller. Choisis la forêt pour couper du bois, ou l’atelier pour fabriquer des planches. Une fois sur place, appuie sur Interagir et lance ton action. Le bois coupé reste en forêt. Pour le ramener, retourne au dépôt et prends une charrette. Va charger le bois en forêt, puis rapporte-le au dépôt.",
    shots: [
      {at:0, site:"foret", from:"siege-forestier", tab:"Aller", rows:["Forêt","Atelier des Menuisiers"], caption:"Choisis le lieu de travail de ton métier dans Aller. Le forestier se rend en forêt et le menuisier travaille à l’atelier."},
      {at:6, site:"foret", pose:"axe", cutting:true, tab:"Interagir · Forêt", rows:["Couper du bois","Tas de la forêt · 5 bois"], caption:"Depuis la forêt, lance ta récolte dans Interagir. Le bois coupé rejoint le tas sur place."},
      {at:12, site:"siege-forestier", from:"foret", cutting:true, tab:"Aller · Dépôt", rows:["Retourner au dépôt des Forestiers"], caption:"Laisse le bois dans le tas et retourne à pied au dépôt des Forestiers."},
      {at:16, site:"foret", from:"siege-forestier", cart:"empty", cutting:true, tab:"Interagir · Dépôt", rows:["Ramener le bois au dépôt","Charrette vide"], caption:"Depuis le dépôt, lance le ramassage. Ton personnage prend une charrette vide et repart en forêt."},
      {at:21, site:"foret", pose:"load", cart:"logs", tab:"Ramassage · Forêt", rows:["Charger le bois du tas"], caption:"En forêt, ton personnage charge le bois dans la charrette."},
      {at:24, site:"siege-forestier", from:"foret", cart:"logs", tab:"Ramassage · Retour", rows:["Rapporter le bois au dépôt","Destination · stock de guilde"], caption:"Ton personnage rentre avec le chargement. Le bois rejoint le stock de la guilde à l’arrivée."},
    ],
  },
  {
    title:"Livrer", duration:21, audio: "./aide-solara-livrer.mp3", audioDuration: 14.878625,
    narration:"Rends-toi au marché. Les demandes te montrent ce que le village recherche. Si le dépôt a du stock, tu peux répondre à la commande. Retourne ensuite au dépôt et lance la livraison. La carte te montre la charrette en chemin vers le chantier.",
    shots: [
      {at:0, site:"marche", tab:"Interagir · Marché", rows:["Recherché · 4 bois","Répondre avec ma guilde"], caption:"Au marché, repère la demande de la mairie et valide la vente avec ta guilde si le bois est disponible."},
      {at:8, site:"siege-forestier", from:"marche", tab:"Interagir · Dépôt", rows:["Faire une livraison","Destination · chantier de la carrière"], caption:"Retourne au dépôt. Faire une livraison charge la commande prête à partir."},
      {at:13, site:"carriere", from:"siege-forestier", zoom:930, cart:"logs", tab:"Livraison en cours", rows:["4 bois en route","Chantier de la carrière"], caption:"Le chantier reçoit le bois à l’arrivée de la charrette."},
    ],
  },
  {
    title:"Construire", duration:21, audio: "./aide-solara-construire.mp3", audioDuration: 17.779875,
    narration:"Une fois les matériaux livrés, les joueurs peuvent construire un module. Quand le chantier est terminé, on se retrouve à la mairie pour l’inauguration. Le village grandit et un nouveau métier s’ouvre. Au prochain live, tu retrouves ton personnage et le village reprend là où vous en étiez.",
    shots: [
      {at:0, site:"carriere", built:"last", pose:"build", ready:true, tab:"Interagir · Chantier", rows:["Construire un module","Matériaux réunis"], caption:"Une fois les matériaux réunis, va au chantier et construis un module."},
      {at:8, site:"village", from:"carriere", tab:"Interagir · Mairie", rows:["Inauguration","Rendez-vous à la mairie"], caption:"Quand le chantier est terminé, retrouve les autres à la mairie pour l’inauguration."},
      {at:15, site:"carriere", zoom:1150, built:"open", tab:"Village · Niveau 2", rows:["Carrière ouverte","Nouveau métier · Mineur"], caption:"La carrière ouvre le métier de mineur. Au prochain live, la partie reprend avec le même village."},
    ],
  },
];

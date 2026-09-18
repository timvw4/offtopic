-- Refonte du thème « Technologie ».
--
-- C'était le thème le plus abîmé : 43 de ses 50 paires étaient du jargon
-- logiciel ou des concepts qu'on ne peut pas dessiner du tout.
--
--   • 38 paires de pur jargon : api/webhook, frontend/backend, ci/cd,
--     hachage/sel, variable/constante, cluster/kubernetes, merge/conflit…
--     Aucun de ces mots n'a de forme. Un joueur ne pouvait rien dessiner, et
--     les non-informaticiens ne comprenaient même pas leur mot.
--   • 3 paires réutilisaient un mot présent dans un autre thème : micro
--     (Divertissement), télécommande (Objets du quotidien), caméra
--     (Divertissement), plus branche, session, clé et test qui disparaissent
--     avec les paires de jargon.
--   • 1 paire était indissociable au dessin : carte graphique/carte son, deux
--     cartes vertes identiques.
--   • 1 paire utilisait un mot ambigu : « contrôleur » (manette de VR, mais
--     aussi contrôleur de train).
--
-- Correction : 43 paires supprimées, 43 nouvelles paires ajoutées.
-- Le thème devient « objets technologiques » plutôt que « informatique » :
-- tech rétro, audio-vidéo, réseau et énergie, mobilier urbain connecté,
-- mobilité électrique. Tout est un objet physique qu'on peut dessiner.
--
-- Le thème conserve ses 7 paires valides : ordinateur/smartphone,
-- processeur/carte mère, disque dur/clé usb, clavier/souris, écran/projecteur,
-- routeur/modem, tableur/diaporama. Total après migration : 50 paires.

delete from public.word_pairs
where theme = 'technologie'
  and (word_fr_civil, word_fr_hors_theme) in (
    -- Jargon logiciel et concepts indessinables (38)
    ('mémoire vive', 'stockage'),
    ('fibre', 'ethernet'),
    ('wifi', 'bluetooth'),
    ('serveur', 'client'),
    ('base de données', 'requête'),
    ('frontend', 'backend'),
    ('api', 'webhook'),
    ('navigateur', 'onglet'),
    ('moteur de recherche', 'index'),
    ('système', 'fichier'),
    ('algorithme', 'donnée'),
    ('variable', 'constante'),
    ('boucle', 'condition'),
    ('fonction', 'module'),
    ('objet', 'classe'),
    ('commit', 'branche'),
    ('merge', 'conflit'),
    ('test', 'déploiement'),
    ('conteneur', 'image'),
    ('dockerfile', 'registry'),
    ('cluster', 'kubernetes'),
    ('microservice', 'gateway'),
    ('jeton', 'session'),
    ('chiffrement', 'clé'),
    ('hachage', 'sel'),
    ('pare-feu', 'antivirus'),
    ('backup', 'restauration'),
    ('journal', 'métrique'),
    ('capteur', 'iot'),
    ('robot', 'servo'),
    ('lunettes ar', 'affichage'),
    ('assistant vocal', 'commande'),
    ('reconnaissance vocale', 'transcription'),
    ('vision par ordinateur', 'caméra'),
    ('réseau de neurones', 'dataset'),
    ('annotation', 'pipeline'),
    ('ci', 'cd'),
    ('mail', 'messagerie'),
    -- Mot déjà utilisé dans un autre thème (2)
    ('webcam', 'micro'),
    ('drone', 'télécommande'),
    -- Indissociable au dessin (1)
    ('carte graphique', 'carte son'),
    -- Mot ambigu, et redondant avec l'imprimante classique (2)
    ('casque vr', 'contrôleur'),
    ('imprimante 3d', 'filament')
  );

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Tech rétro (7)
  ('cassette', 'disquette', 'cassette tape', 'floppy disk', 'technologie'),
  ('vinyle', 'tourne-disque', 'vinyl record', 'turntable', 'technologie'),
  ('magnétoscope', 'lecteur dvd', 'vcr', 'dvd player', 'technologie'),
  ('machine à écrire', 'calculatrice', 'typewriter', 'calculator', 'technologie'),
  ('dictaphone', 'baladeur', 'voice recorder', 'walkman', 'technologie'),
  ('chaîne hi-fi', 'magnétophone', 'hi-fi system', 'tape recorder', 'technologie'),
  ('cabine téléphonique', 'parcmètre', 'phone booth', 'parking meter', 'technologie'),

  -- Bureau (3)
  ('fax', 'imprimante', 'fax machine', 'printer', 'technologie'),
  ('photocopieuse', 'scanner', 'photocopier', 'scanner', 'technologie'),
  ('tablette', 'liseuse', 'tablet', 'e-reader', 'technologie'),

  -- Audio et vidéo (7)
  ('appareil photo', 'caméscope', 'camera', 'camcorder', 'technologie'),
  ('casque audio', 'écouteurs', 'headphones', 'earbuds', 'technologie'),
  ('enceinte', 'barre de son', 'speaker', 'soundbar', 'technologie'),
  ('radio', 'talkie-walkie', 'radio', 'walkie-talkie', 'technologie'),
  ('trépied', 'perche à selfie', 'tripod', 'selfie stick', 'technologie'),
  ('mégaphone', 'klaxon', 'megaphone', 'horn', 'technologie'),
  ('casque vr', 'lunettes connectées', 'vr headset', 'smart glasses', 'technologie'),

  -- Optique et mesure (5)
  ('télescope', 'microscope', 'telescope', 'microscope', 'technologie'),
  ('thermomètre', 'tensiomètre', 'thermometer', 'blood pressure monitor', 'technologie'),
  ('chronomètre', 'minuteur', 'stopwatch', 'kitchen timer', 'technologie'),
  ('gps', 'boussole', 'gps', 'compass', 'technologie'),
  ('station météo', 'girouette', 'weather station', 'weathervane', 'technologie'),

  -- Réseau, énergie et infrastructure (7)
  ('antenne', 'parabole', 'antenna', 'satellite dish', 'technologie'),
  ('paratonnerre', 'pylône électrique', 'lightning rod', 'power pylon', 'technologie'),
  ('panneau solaire', 'éolienne', 'solar panel', 'wind turbine', 'technologie'),
  ('centrale nucléaire', 'barrage', 'nuclear plant', 'dam', 'technologie'),
  ('pile', 'batterie externe', 'battery', 'power bank', 'technologie'),
  ('thermostat', 'compteur électrique', 'thermostat', 'electricity meter', 'technologie'),
  ('borne de recharge', 'pompe à essence', 'charging station', 'gas pump', 'technologie'),

  -- Robotique et spatial (3)
  ('robot', 'androïde', 'robot', 'android', 'technologie'),
  ('drone', 'satellite', 'drone', 'satellite', 'technologie'),
  ('lampe de poche', 'pointeur laser', 'flashlight', 'laser pointer', 'technologie'),

  -- Mobilité électrique (2)
  ('trottinette électrique', 'hoverboard', 'electric scooter', 'hoverboard', 'technologie'),
  ('vélo électrique', 'gyropode', 'electric bike', 'segway', 'technologie'),

  -- Tech du quotidien urbain (9)
  ('caisse enregistreuse', 'terminal de paiement', 'cash register', 'card reader', 'technologie'),
  ('distributeur automatique', 'photomaton', 'vending machine', 'photo booth', 'technologie'),
  ('feu de circulation', 'radar', 'traffic light', 'speed camera', 'technologie'),
  ('sonnette connectée', 'détecteur de fumée', 'smart doorbell', 'smoke detector', 'technologie'),
  ('ascenseur', 'escalator', 'elevator', 'escalator', 'technologie'),
  ('tourniquet', 'portique de sécurité', 'turnstile', 'security gate', 'technologie'),
  ('code-barres', 'qr code', 'barcode', 'qr code', 'technologie'),
  ('carte sim', 'carte bancaire', 'sim card', 'bank card', 'technologie'),
  ('montre connectée', 'podomètre', 'smartwatch', 'pedometer', 'technologie');

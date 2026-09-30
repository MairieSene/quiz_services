/* Dix familles de situations : une question de chaque famille par partie. */
(() => {
  const a = (text, main, second) => ({ text, scores: { [main]: 3, [second]: 1 } });
  const q = (category, question, answers) => ({ category, question, answers });
  window.QUIZ_QUESTIONS = [
    q("depart", "Lundi, 9 h 02. Ta boîte mail ressemble déjà à un feu d’artifice. Tu…", [
      a("Classes les priorités. Le chaos a désormais un tableau.", "cadre", "analyse"),
      a("Repères la vraie urgence et passes à l’action.", "urgence", "terrain"),
      a("Appelles les personnes concernées : cinq minutes à parler valent dix mails.", "public", "soutien"),
      a("Trouves une façon plus simple de traiter le flot.", "idee", "cadre")
    ]),
    q("depart", "Ton agenda te laisse enfin une heure libre. Quel luxe choisis-tu ?", [
      a("Boucler le dossier qui attend son heure de gloire.", "cadre", "analyse"),
      a("Aller voir sur place ce qu’un écran ne raconte pas.", "terrain", "vivant"),
      a("Prendre des nouvelles de celles et ceux que tu accompagnes.", "soutien", "public"),
      a("Faire avancer l’idée qui traîne au fond du carnet.", "idee", "animation")
    ]),
    q("depart", "On te confie un nouveau projet. Ton premier objet sur la table ?", [
      a("Un calendrier. Avec des dates qui veulent dire quelque chose.", "cadre", "analyse"),
      a("Un plan du lieu. J’ai besoin de voir le décor.", "terrain", "vivant"),
      a("Un carnet de contacts. Personne n’avance seul.", "public", "soutien"),
      a("Une grande feuille blanche. On va pouvoir imaginer.", "idee", "animation")
    ]),
    q("depart", "Si ta journée était une émission, son générique annoncerait…", [
      a("« Les dossiers sont prêts. Enfin presque. »", "cadre", "analyse"),
      a("« En direct du terrain ! »", "terrain", "urgence"),
      a("« On va trouver une solution ensemble. »", "soutien", "public"),
      a("« Et si on essayait autrement ? »", "idee", "animation")
    ]),
    q("depart", "Avant de dire oui à une nouvelle mission, tu veux surtout savoir…", [
      a("Quel est le cadre et quelle est la date limite.", "cadre", "analyse"),
      a("Où ça se passe et ce qui bloque vraiment.", "terrain", "urgence"),
      a("Qui en a besoin et qui sera à tes côtés.", "public", "soutien"),
      a("Quelle liberté on a pour inventer une réponse.", "idee", "animation")
    ]),

    q("imprevu", "Vendredi, 16 h 55 : un souci surgit. Ton cerveau affiche…", [
      a("« On sécurise maintenant, on explique ensuite. »", "urgence", "terrain"),
      a("« Quels faits sont confirmés ? »", "analyse", "cadre"),
      a("« Qui faut-il prévenir et aider ? »", "soutien", "public"),
      a("« Plan B. Et peut-être plan C. »", "idee", "urgence")
    ]),
    q("imprevu", "La météo bretonne déplace un événement à l’intérieur. Tu…", [
      a("Réorganises le lieu avant que les gouttes gagnent.", "terrain", "urgence"),
      a("Refais le programme sans perdre les personnes en route.", "animation", "soutien"),
      a("Préviens tout le monde avec une information limpide.", "public", "cadre"),
      a("Vérifies capacité, horaires et conditions d’accueil.", "cadre", "analyse")
    ]),
    q("imprevu", "Le vidéoprojecteur rend l’âme deux minutes avant le début. Tu…", [
      a("Trouves un câble, un autre appareil, une prise. À l’attaque.", "terrain", "urgence"),
      a("Présentes sans écran : après tout, tu connais ton sujet.", "idee", "animation"),
      a("Rassures les personnes et adaptes le rythme.", "public", "soutien"),
      a("Sors la version papier. Évidemment qu’il y en a une.", "cadre", "analyse")
    ]),
    q("imprevu", "Deux demandes « urgentes » arrivent exactement ensemble. Tu…", [
      a("Évalues le risque réel et fonces sur le plus sensible.", "urgence", "analyse"),
      a("Clarifies les délais. Les majuscules ne sont pas une échéance.", "cadre", "public"),
      a("Répartis les rôles pour que les deux avancent.", "soutien", "animation"),
      a("Proposes un raccourci malin pour débloquer la situation.", "idee", "terrain")
    ]),
    q("imprevu", "Un lieu est prêt, sauf un détail qui change tout. Ta réaction ?", [
      a("J’y vais, je regarde, je corrige.", "terrain", "urgence"),
      a("Je demande ce qui est indispensable et je m’adapte.", "public", "soutien"),
      a("Je retrouve la consigne initiale et mesure l’écart.", "cadre", "analyse"),
      a("Je transforme la contrainte en nouvelle possibilité.", "idee", "animation")
    ]),

    q("accueil", "Une personne arrive avec une question, puis trois autres. Tu…", [
      a("Écoutes et identifies la vraie demande derrière les quatre.", "public", "soutien"),
      a("Explique la marche à suivre étape par étape.", "cadre", "public"),
      a("Cherches une réponse concrète, même si elle implique de bouger.", "terrain", "urgence"),
      a("Dessines un parcours plus simple pour la prochaine fois.", "idee", "analyse")
    ]),
    q("accueil", "Quelqu’un dit : « Je ne sais pas par où commencer. » Tu réponds…", [
      a("« Racontez-moi, on va démêler ça ensemble. »", "public", "soutien"),
      a("« Voici les trois étapes, pas une de plus. »", "cadre", "analyse"),
      a("« Montrez-moi ce qui pose problème. »", "terrain", "urgence"),
      a("« On va trouver une autre entrée dans le sujet. »", "idee", "public")
    ]),
    q("accueil", "On te remercie après une journée chargée. Qu’est-ce qui te touche le plus ?", [
      a("Avoir mis quelqu’un à l’aise dès son arrivée.", "public", "soutien"),
      a("Avoir débloqué une situation compliquée avec méthode.", "analyse", "cadre"),
      a("Avoir rendu un lieu ou un objet immédiatement utilisable.", "terrain", "urgence"),
      a("Avoir créé un moment dont les gens reparleront.", "animation", "idee")
    ]),
    q("accueil", "Une personne revient parce qu’elle n’a pas compris ta première explication. Tu…", [
      a("Reprends avec d’autres mots, sans la presser.", "public", "soutien"),
      a("Fais une petite liste qu’elle pourra garder.", "cadre", "analyse"),
      a("Montres directement comment faire.", "terrain", "public"),
      a("Inventes un exemple qui parle vraiment.", "idee", "animation")
    ]),
    q("accueil", "À une porte ouverte, tu te retrouves naturellement…", [
      a("À saluer tout le monde et orienter les visiteurs.", "public", "soutien"),
      a("À garder l’œil sur le déroulé et les horaires.", "cadre", "analyse"),
      a("À régler les petits soucis matériels avant qu’on les voie.", "terrain", "urgence"),
      a("À lancer une activité pour mettre les gens ensemble.", "animation", "idee")
    ]),

    q("equipe", "La réunion part dans six directions. Tu deviens…", [
      a("La personne qui reformule ce qu’on cherche à décider.", "cadre", "analyse"),
      a("La personne qui demande : « On essaie quoi, concrètement ? »", "terrain", "urgence"),
      a("La personne qui redonne la parole aux plus discrets.", "soutien", "public"),
      a("La personne qui lance une idée que personne n’avait vue venir.", "idee", "animation")
    ]),
    q("equipe", "Un collègue demande un coup de main. Ton offre spontanée ?", [
      a("« Je prends une partie, on s’y met ensemble. »", "soutien", "animation"),
      a("« On clarifie le problème et on priorise. »", "analyse", "cadre"),
      a("« Montre-moi où ça coince, je viens. »", "terrain", "urgence"),
      a("« J’ai une petite idée qui pourrait tout simplifier. »", "idee", "public")
    ]),
    q("equipe", "Dans un projet commun, ton super-pouvoir est plutôt de…", [
      a("Relier des personnes qui ne se seraient pas rencontrées.", "animation", "public"),
      a("Faire tenir les étapes et les décisions ensemble.", "cadre", "analyse"),
      a("Passer de l’idée au concret sans traîner.", "terrain", "urgence"),
      a("Voir ce dont chacun a besoin pour avancer.", "soutien", "public")
    ]),
    q("equipe", "Une nouvelle personne rejoint l’équipe. Tu lui transmets d’abord…", [
      a("Les prénoms, les habitudes et le meilleur point de contact.", "public", "soutien"),
      a("Le dossier de référence, bien rangé, avec un vrai sommaire.", "cadre", "analyse"),
      a("Une visite sur place. On comprend mieux en marchant.", "terrain", "vivant"),
      a("L’envie de proposer ses propres idées tout de suite.", "idee", "animation")
    ]),
    q("equipe", "Après un projet réussi, qu’as-tu envie de célébrer ?", [
      a("La confiance que l’équipe a construite.", "soutien", "public"),
      a("Le fait que tout a tenu malgré les contraintes.", "cadre", "analyse"),
      a("Le résultat visible, là, devant nous.", "terrain", "urgence"),
      a("L’énergie que ça a donnée aux participants.", "animation", "idee")
    ]),

    q("regles", "Une idée est bonne, mais le règlement dit « attention ». Tu…", [
      a("Lis la règle jusqu’au bout : une solution s’y cache peut-être.", "cadre", "analyse"),
      a("Vérifies sur place ce que la règle doit protéger.", "terrain", "vivant"),
      a("Expliques le pourquoi aux personnes concernées.", "public", "soutien"),
      a("Cherches une autre voie qui respecte le cadre.", "idee", "cadre")
    ]),
    q("regles", "On te donne le fichier FINAL_v2_definitif_BON.xlsx. Tu…", [
      a("Vérifies la date, la source et les formules. Le titre ne suffit pas.", "analyse", "cadre"),
      a("Demandes à l’équipe quelle version sert vraiment.", "public", "soutien"),
      a("Regardes si les chiffres collent à ce qu’on voit sur le terrain.", "terrain", "analyse"),
      a("Proposes un nommage que même vendredi soir on comprendra.", "idee", "cadre")
    ]),
    q("regles", "Une procédure tient sur quatre pages. Ton instinct ?", [
      a("Je la lis : chaque détail a sans doute une raison.", "cadre", "analyse"),
      a("Je fais une version « trois gestes pour démarrer ».", "idee", "public"),
      a("Je demande où elle bloque dans la vraie vie.", "terrain", "soutien"),
      a("Je l’explique sans faire sentir à quiconque qu’il aurait dû savoir.", "public", "soutien")
    ]),
    q("regles", "Deux documents se contredisent. Qui mène l’enquête ?", [
      a("Moi. Dates, versions, sources : on reprend la piste.", "analyse", "cadre"),
      a("Moi, avec les auteurs au téléphone pour gagner du temps.", "public", "soutien"),
      a("Moi, en vérifiant ce qui se passe réellement sur place.", "terrain", "urgence"),
      a("Moi, avec un schéma qui rendra le conflit impossible à l’avenir.", "idee", "cadre")
    ]),
    q("regles", "On doit trancher entre deux bonnes options. Tu réclames…", [
      a("Des critères clairs, sinon on compare des pommes et des marées.", "analyse", "cadre"),
      a("Un test en situation, même à petite échelle.", "terrain", "urgence"),
      a("L’avis des personnes qui vivront avec la décision.", "public", "soutien"),
      a("Le droit de combiner le meilleur des deux.", "idee", "animation")
    ]),

    q("terrain", "Tu découvres un lieu que tu ne connais pas. Ton regard va d’abord vers…", [
      a("Les accès, les prises, les détails qui feront marcher la journée.", "terrain", "urgence"),
      a("Les personnes présentes et leurs habitudes.", "public", "soutien"),
      a("Ce que le lieu raconte du vivant autour de lui.", "vivant", "analyse"),
      a("Tout ce qu’on pourrait imaginer ici.", "idee", "animation")
    ]),
    q("terrain", "Un plan est impeccable. Avant de dire oui, tu veux…", [
      a("Y aller. Une porte dessinée n’est pas toujours une porte pratique.", "terrain", "analyse"),
      a("Vérifier les contraintes et les chiffres.", "cadre", "analyse"),
      a("Parler à celles et ceux qui utiliseront l’endroit.", "public", "soutien"),
      a("Imaginer comment il pourrait vivre autrement.", "idee", "animation")
    ]),
    q("terrain", "Une visite dehors est prévue. La meilleure raison d’y aller ?", [
      a("Voir le problème de ses propres yeux.", "terrain", "urgence"),
      a("Écouter les personnes qui connaissent le lieu.", "public", "soutien"),
      a("Observer ce que les saisons ou la marée changent.", "vivant", "analyse"),
      a("Revenir avec une idée qu’aucune réunion n’aurait trouvée.", "idee", "terrain")
    ]),
    q("terrain", "On te dit : « Ça marche très bien sur le papier. » Tu réponds…", [
      a("« Alors testons-le sur le sol ! »", "terrain", "urgence"),
      a("« Montrez-moi les hypothèses et les chiffres. »", "analyse", "cadre"),
      a("« Demandons à ceux qui s’en serviront. »", "public", "soutien"),
      a("« Et si on en faisait une version plus audacieuse ? »", "idee", "animation")
    ]),
    q("terrain", "Sur le littoral, ton attention est attirée par…", [
      a("Les changements de marée et de paysage.", "vivant", "terrain"),
      a("La façon dont les gens utilisent l’espace.", "public", "terrain"),
      a("Les repères et règles qui rendent le partage possible.", "cadre", "analyse"),
      a("Les activités qu’on pourrait y faire découvrir.", "animation", "idee")
    ]),

    q("clarte", "Une explication provoque plus de questions que de réponses. Tu…", [
      a("Recommences avec un exemple concret et un sourire.", "public", "soutien"),
      a("Fais trois étapes numérotées, pas dix-sept.", "cadre", "analyse"),
      a("Montres le geste directement.", "terrain", "urgence"),
      a("Trouves l’image qui rend tout évident.", "idee", "animation")
    ]),
    q("clarte", "Tu dois annoncer un changement. Quel titre choisis-tu ?", [
      a("Un titre clair avec la date et l’action attendue.", "cadre", "analyse"),
      a("Un titre qui donne envie d’ouvrir le message.", "idee", "animation"),
      a("Un titre qui répond d’abord à la question des personnes concernées.", "public", "soutien"),
      a("Un titre court : pendant ce temps, j’ai déjà préparé le lieu.", "terrain", "urgence")
    ]),
    q("clarte", "Une personne découvre un nouvel outil. Tu es le guide qui…", [
      a("Rassure : on peut apprendre sans tout savoir d’emblée.", "soutien", "public"),
      a("Donne une fiche simple et fiable.", "cadre", "analyse"),
      a("Laisse essayer, puis intervient au bon moment.", "terrain", "public"),
      a("Transforme l’exercice en petit défi amusant.", "animation", "idee")
    ]),
    q("clarte", "Dans un message important, tu défends surtout…", [
      a("L’exactitude : pas une date de travers.", "analyse", "cadre"),
      a("La chaleur : on parle à des personnes, pas à une boîte de réception.", "public", "soutien"),
      a("La simplicité : une phrase, une action.", "idee", "cadre"),
      a("Le côté pratique : où, quand, comment, sur place.", "terrain", "urgence")
    ]),
    q("clarte", "On te demande de résumer une réunion en trente secondes. Tu dis…", [
      a("La décision, les responsables, la date.", "cadre", "analyse"),
      a("Ce que ça va changer pour les gens.", "public", "soutien"),
      a("Ce qu’on va faire dès demain matin.", "terrain", "urgence"),
      a("L’idée brillante qu’on a failli laisser passer.", "idee", "animation")
    ]),

    q("invention", "Un projet a peu de budget, mais beaucoup d’énergie. Tu…", [
      a("Imagines une version légère et surprenante.", "idee", "animation"),
      a("Fais l’inventaire de ce qui existe déjà.", "analyse", "cadre"),
      a("Mobilises les personnes prêtes à aider.", "soutien", "public"),
      a("Construis un prototype avec ce qu’on a sous la main.", "terrain", "urgence")
    ]),
    q("invention", "On te laisse carte blanche pour une journée municipale. Ta première idée ?", [
      a("Un moment qui donne envie aux gens de se rencontrer.", "animation", "public"),
      a("Un parcours bien pensé, accessible et facile à suivre.", "cadre", "soutien"),
      a("Une découverte concrète des lieux et des gestes.", "terrain", "vivant"),
      a("Un format inattendu, dont on se souviendra.", "idee", "animation")
    ]),
    q("invention", "La phrase « On a toujours fait comme ça » te donne envie de…", [
      a("Demander pourquoi, avec une vraie curiosité.", "analyse", "cadre"),
      a("Essayer une petite variante sans tout bousculer.", "idee", "terrain"),
      a("Écouter ceux qui vivent cette habitude au quotidien.", "public", "soutien"),
      a("Garder ce qui fonctionne et fêter l’expérience collective.", "animation", "cadre")
    ]),
    q("invention", "Un stand attire peu de visiteurs. Ton geste ?", [
      a("Changer la mise en scène pour éveiller la curiosité.", "idee", "animation"),
      a("Aller discuter avec les passants sans les harponner.", "public", "soutien"),
      a("Regarder l’emplacement, le flux et les horaires.", "analyse", "terrain"),
      a("Réaménager le stand pour le rendre plus visible.", "terrain", "urgence")
    ]),
    q("invention", "Tu peux ajouter une seule chose à un projet déjà prêt. Ce sera…", [
      a("Une touche qui donne envie de participer.", "animation", "idee"),
      a("Un contrôle final pour éviter les mauvaises surprises.", "analyse", "cadre"),
      a("Un moyen de recueillir l’avis des personnes concernées.", "public", "soutien"),
      a("Une solution de secours facile à déclencher.", "urgence", "terrain")
    ]),

    q("regard", "Lors d’une balade à Séné, tu repères d’abord…", [
      a("Les oiseaux, les plantes, et ce qui change avec la saison.", "vivant", "analyse"),
      a("Les petits aménagements qui facilitent la vie.", "terrain", "urgence"),
      a("Les lieux où les gens se retrouvent.", "public", "animation"),
      a("Un angle parfait pour raconter l’endroit.", "idee", "animation")
    ]),
    q("regard", "On te montre une photo d’un lieu avant un projet. Tu demandes…", [
      a("« Qu’est-ce qui vit ici, même quand on ne le voit pas ? »", "vivant", "analyse"),
      a("« Comment les personnes circulent-elles ? »", "terrain", "public"),
      a("« Quelles règles et mesures faut-il connaître ? »", "cadre", "analyse"),
      a("« Et si on imaginait un nouvel usage ? »", "idee", "animation")
    ]),
    q("regard", "Une petite variation passe inaperçue pour les autres. Pour toi, c’est…", [
      a("Un indice à observer avant d’agir.", "vivant", "analyse"),
      a("Le signe qu’un réglage pratique s’impose.", "terrain", "urgence"),
      a("Peut-être un besoin que quelqu’un n’ose pas formuler.", "soutien", "public"),
      a("Le début d’une idée à explorer.", "idee", "animation")
    ]),
    q("regard", "Face à un espace partagé, tu te demandes surtout…", [
      a("Comment préserver ses équilibres sur la durée.", "vivant", "cadre"),
      a("Si tout fonctionne vraiment pour les usagers.", "terrain", "public"),
      a("Qui s’y sent bien et qui manque encore à l’appel.", "soutien", "animation"),
      a("Quelle histoire on pourrait y faire vivre.", "idee", "animation")
    ]),
    q("regard", "Si tu devais garder une trace d’une sortie sur le terrain, ce serait…", [
      a("Des observations datées pour suivre les évolutions.", "vivant", "analyse"),
      a("Une liste de choses à réparer ou améliorer.", "terrain", "urgence"),
      a("Les remarques des personnes rencontrées.", "public", "soutien"),
      a("Des photos et une idée pour les partager.", "idee", "animation")
    ]),

    q("finale", "À la fin d’une grosse journée, ta plus belle victoire serait…", [
      a("Un dossier impeccable qui va enfin pouvoir avancer.", "cadre", "analyse"),
      a("Un problème concret résolu avant la nuit.", "terrain", "urgence"),
      a("Une personne repartie plus sereine qu’à son arrivée.", "soutien", "public"),
      a("Un collectif qui a retrouvé l’envie d’agir.", "animation", "idee")
    ]),
    q("finale", "Ton collègue résume ton style en une phrase. Laquelle te ressemble ?", [
      a("« Avec toi, les choses sont carrées. »", "cadre", "analyse"),
      a("« Avec toi, ça avance pour de vrai. »", "terrain", "urgence"),
      a("« Avec toi, on se sent écouté. »", "soutien", "public"),
      a("« Avec toi, on ne manque jamais d’idées. »", "idee", "animation")
    ]),
    q("finale", "S’il fallait choisir une devise de travail, ce serait…", [
      a("« Les faits d’abord, la décision ensuite. »", "analyse", "cadre"),
      a("« On retrousse les manches. »", "terrain", "urgence"),
      a("« Personne ne reste au bord du chemin. »", "soutien", "public"),
      a("« Essayons, on apprendra en chemin. »", "idee", "animation")
    ]),
    q("finale", "Le trophée imaginaire du quiz récompenserait chez toi…", [
      a("Le calme devant les dossiers les plus tordus.", "analyse", "cadre"),
      a("Le réflexe d’agir quand il faut agir.", "urgence", "terrain"),
      a("L’art de faire une place à chacun.", "soutien", "public"),
      a("La capacité à transformer une idée en fête collective.", "animation", "idee")
    ]),
    q("finale", "Si tu avais un bouton magique au bureau, il ferait quoi ?", [
      a("Ranger les versions du fichier dans le bon ordre.", "cadre", "analyse"),
      a("T’envoyer instantanément là où il faut intervenir.", "terrain", "urgence"),
      a("Donner du temps pour écouter chaque personne.", "public", "soutien"),
      a("Faire apparaître la solution à laquelle personne n’avait pensé.", "idee", "animation")
    ])
  ];
})();

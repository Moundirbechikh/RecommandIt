import React, { useState } from "react";
import { Info, AlertCircle, Star, Film, Heart, LifeBuoy, ChevronUp, ChevronDown, Copy } from "lucide-react";

// Données des sections
const infoData = [
  {
    id: "usage",
    title: "Comment utiliser le site",
    tag: "Guide",
    icon: <Info className="w-5 h-5 text-black" />,
    steps: [
      "Créer un compte utilisateur pour sauvegarder vos préférences.",
      "Ajouter des films à vos favoris pour personnaliser votre profil.",
      "Explorer les nouveaux films proposés chaque semaine.",
      "Basculer entre carrousel et grille pour explorer les films différemment.",
      "Utiliser les boutons d’action pour voir plus de détails sur un film."
    ],
    details: [
      "Toutes les actions sont accessibles à chaque utilisateur.",
      "Ton profil conserve tes favoris et tes préférences pour améliorer les recommandations."
    ],
  },
  {
    id: "recommendation",
    title: "Comment fonctionne la recommandation",
    tag: "Recommandation",
    icon: <Star className="w-5 h-5 text-black" />,
    steps: [
      "Étape 1 : Le système analyse les films que tu as ajoutés en favoris.",
      "Étape 2 : Il compare tes goûts avec ceux des autres utilisateurs.",
      "Étape 3 : Il identifie les films similaires appréciés par des profils proches du tien.",
      "Étape 4 : Les nouveaux films sont intégrés pour diversifier tes choix.",
      "Étape 5 : Les recommandations sont mises à jour automatiquement selon tes interactions."
    ],
    details: [
      "La recommandation est collaborative (IBCF : Item-Based Collaborative Filtering).",
      "Plus tu ajoutes de favoris, plus les suggestions deviennent pertinentes.",
      "Chaque étape affine la précision des recommandations."
    ],
  },
  {
    id: "newfilms",
    title: "Nouveaux films",
    tag: "Découverte",
    icon: <Film className="w-5 h-5 text-black" />,
    steps: [
      "Chaque semaine, 3 nouveaux films sont mis en avant.",
      "Ces films sont choisis selon leur popularité et leur sortie récente.",
      "Tu peux les ajouter directement à tes favoris pour influencer tes recommandations."
    ],
    details: [
      "Les affiches et titres sont visibles dans la section 'Nouveaux films'.",
      "Cela permet de découvrir rapidement les dernières sorties."
    ],
  },
  {
    id: "favorites",
    title: "Gestion des favoris",
    tag: "Favoris",
    icon: <Heart className="w-5 h-5 text-black" />,
    steps: [
      "Cliquer sur ⭐ pour ajouter un film à tes favoris.",
      "Accéder à la section 'Mes favoris' pour voir ta liste complète.",
      "Supprimer un favori en cliquant sur l’icône correspondante.",
      "Les favoris influencent directement les recommandations."
    ],
    details: [
      "Tes favoris sont sauvegardés dans ton profil.",
      "Ils servent de base pour calculer les suggestions personnalisées."
    ],
  },
  {
    id: "troubleshoot",
    title: "Dépannage rapide",
    tag: "Aide",
    icon: <AlertCircle className="w-5 h-5 text-black" />,
    steps: [
      "Je ne vois pas mes films → vérifie la recherche ou recharge la page.",
      "Le carrousel ne défile pas → vérifie ta connexion internet.",
      "Un favori ne s’ajoute pas → assure-toi d’être connecté à ton compte.",
      "Si un film n’apparaît pas → vérifie qu’il est bien disponible dans la base."
    ],
    details: [
      "Si tu vois des comportements incohérents, prends une capture d'écran et contacte le support.",
      "Les bugs connus sont listés dans la section 'Support'."
    ],
  },
  {
    id: "support",
    title: "Support & Assistance",
    tag: "Support",
    icon: <LifeBuoy className="w-5 h-5 text-black" />,
    steps: [
      "Accéder à la section 'Support' depuis le menu principal.",
      "Envoyer un message via le formulaire de contact.",
      "Décrire ton problème avec le maximum de détails (capture d’écran, étapes suivies).",
      "Attendre la réponse de l’équipe technique (délai moyen : 24h)."
    ],
    details: [
      "Le support est disponible 7j/7 par email ou formulaire intégré.",
      "Les problèmes critiques sont traités en priorité.",
      "Tu peux aussi consulter la FAQ pour des solutions rapides."
    ],
    faq: [
      "Comment réinitialiser mon mot de passe ? → Va dans Profil > Sécurité > Réinitialiser.",
      "Comment supprimer mon compte ? → Contacte le support via le formulaire.",
      "Comment signaler un bug ? → Utilise la section 'Support' et joins une capture d’écran.",
      "Comment ajouter un film manuellement ? → Utilise la barre de recherche et clique sur 'Ajouter'."
    ]
  },
];

// Composant StepBlock
function StepBlock({ steps }) {
  const text = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Étapes copiées dans le presse-papiers");
    } catch (e) {
      alert("Impossible de copier — autorise le presse-papiers ou copie manuellement.");
    }
  };

  return (
    <div className="mt-3 bg-white/20 w-full">
      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-800">
        {steps.map((s, i) => (
          <li key={i} className="leading-tight">{s}</li>
        ))}
      </ol>
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg hover:bg-black hover:text-white transition"
        >
          <Copy className="w-4 h-4" /> Copier les étapes
        </button>
      </div>
    </div>
  );
}

// Composant AccordionItem
function AccordionItem({ data, open, onToggle }) {
  return (
    <div className="w-full overflow-hidden">
      <div className="bg-white/60 rounded-lg p-3 transition w-full hover:bg-white/80">
        <div
          className="flex items-center justify-between cursor-pointer w-full"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3 font-semibold text-black">
            {data.icon} {data.title}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{data.tag}</span>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {open && (
          <div className="mt-3 text-sm text-gray-800">
            <StepBlock steps={data.steps} />
            {data.details && (
              <div className="mt-3 text-sm text-gray-700">
                {data.details.map((d, i) => (
                  <p key={i} className="mb-1">• {d}</p>
                ))}
              </div>
            )}
            {data.faq && (
              <div className="mt-3 text-sm text-gray-700">
                <h3 className="font-semibold mb-2">FAQ :</h3>
                {data.faq.map((q, i) => (
                  <p key={i} className="mb-1">• {q}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant principal Info
export default function Infobase() {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="space-y-4 w-full">
      <h1 className="text-5xl font-parisienne text-black font-bold p-5">Plus d'informations</h1>
      {infoData.map((item) => (
        <AccordionItem
          key={item.id}
          data={item}
          open={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? null : item.id)}
        />
      ))}
    </div>
  );
}

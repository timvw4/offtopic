"use client";

import Link from "next/link";

export default function RulesPage() {
  return (
    <div className="card" style={{ display: "grid", gap: 16, padding: 24 }}>
      <h1>Règles du jeu</h1>
      <p style={{ margin: 0 }}>Résumé rapide pour démarrer une partie.</p>

      <section style={{ display: "grid", gap: 8 }}>
        <h3>Objectif</h3>
        <p>
          Trouver et éliminer les Hors-Thème (ou le Caméléon s&apos;il est activé) en se basant sur les dessins. Les
          Hors-Thème/Caméléon tentent de survivre sans se faire repérer.
        </p>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h3>Rôles</h3>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
          <li>
            <strong>Civil</strong> : connaît le mot Civil et dessine ce mot.
          </li>
          <li>
            <strong>Hors-Thème</strong> : connaît un mot différent et essaye de passer pour un Civil.
          </li>
          <li>
            <strong>Caméléon</strong> (optionnel, activable dès 5 joueurs) : ne doit pas être identifié comme Caméléon.
            Chaque joueur (sauf lui) peut l&apos;accuser une seule fois dans la partie.
          </li>
        </ul>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h3>Déroulé d&apos;un tour</h3>
        <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
          <li>Mot secret : chacun voit son mot (Civil ou Hors-Thème). Le Caméléon voit le mot Civil.</li>
          <li>Dessin : tout le monde dessine pendant le temps imparti.</li>
          <li>Révélation : tous les dessins s&apos;affichent.</li>
          <li>
            Vote : chaque joueur fait un choix unique :
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Soit voter pour éliminer un joueur.</li>
              <li>Soit accuser le Caméléon (si activé, et une seule fois par partie).</li>
              <li>Le Caméléon peut voter mais ne peut pas accuser un autre caméléon.</li>
            </ul>
          </li>
          <li>Résultats : on élimine le joueur qui a le plus de votes (revote en cas d&apos;égalité).</li>
        </ol>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h3>Conditions de victoire</h3>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
          <li>Les civils gagnent si tous les Hors-Thème sont éliminés.</li>
          <li>Les Hors-Thème gagnent s&apos;ils sont au moins 50% des joueurs restants.</li>
          <li>Le Caméléon perd s&apos;il est identifié et accusé correctement.</li>
        </ul>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h3>Égalités & revote</h3>
        <p>
          En cas d&apos;égalité au vote, un revote est lancé uniquement entre les joueurs ex æquo. Les votes précédents
          restent visibles.
        </p>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h3>Autres règles</h3>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
          <li>Un joueur éliminé devient spectateur : il ne dessine plus et ne vote plus.</li>
          <li>Un joueur ne peut rejoindre qu&apos;une partie en lobby. En cours de partie, l&apos;entrée est bloquée.</li>
          <li>Chaque joueur ne peut accuser qu&apos;une fois un caméléon par partie.</li>
        </ul>
      </section>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link href="/" className="btn">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}

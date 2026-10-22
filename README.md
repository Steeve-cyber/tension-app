# Tensio

Une application Expo / React Native pour enregistrer des mesures de tension à domicile et suivre leur évolution.

## Lancer le projet

```bash
npm install
npx expo start
```

Ouvrez ensuite l’application avec Expo Go ou un simulateur iOS / Android. Le projet propose aussi une version web avec le même suivi local et un export CSV.

## Fonctions

- Saisie guidée de la systolique, de la diastolique, du pouls, du moment et d’une note facultative.
- Historique conservé sur l’appareil, avec suppression d’un relevé ou de l’ensemble du carnet.
- Moyennes sur 7 jours, courbes de tendance et filtres sur 7 jours, 30 jours ou tout l’historique.
- Export CSV et rappels locaux quotidiens sur iOS et Android.
- Conseils pour effectuer une automesure dans de bonnes conditions.

Les valeurs de référence affichées sont indicatives pour une mesure à domicile chez l’adulte. Une seule mesure ne permet pas de poser un diagnostic. En cas de doute, de valeurs répétées au-dessus du repère, ou de symptômes, demandez conseil à un professionnel de santé.

Les anciens relevés du prototype sont conservés. Comme leur date complète n’était pas enregistrée, ils restent consultables et exportables mais ne sont pas placés sur les courbes datées.

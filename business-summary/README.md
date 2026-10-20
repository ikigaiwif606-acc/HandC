# Raja Uda Wellness Studio — Business Summary

Static business summary for the planned Raja Uda wellness studio. The page includes its concept visuals, day/night themes, space tabs, a revised floor plan and print view. It requires no build step or dependencies.

Live site: https://handc-business-summary.vercel.app/#floor-plan

## Floor plan

Revision 02 separates the men's and women's shower/changing suites with an open centre passage. Each suite retains two showers, one private changing cubicle and a basin. Both existing WCs remain at the rear-left, accessed from the shared rear hall.

The floor-plan section follows Facilities and includes full-studio and suite-detail previews, an accessible enlarged viewer with zoom controls, and a downloadable two-page PDF. The drawing remains a conditional concept, with dimensions and clearances subject to a measured survey.

- `assets/raja_uda_wellness_concept_plan_rev02.pdf` — revised concept document.
- `assets/studio-floor-plan-rev02.png` — full plan preview rendered from the revised PDF.
- `assets/changing-suites-rev02.png` — enlarged rear-area preview from the same PDF.
- `floor-plan.css` and `floor-plan.js` — responsive layout and enlarged viewer.

## Run locally

From this directory:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Open http://127.0.0.1:4174/.

## Deploy

The Vercel project `handc-business-summary` uses this repository and the `business-summary` root directory, with the framework set to Other and no build command. Production deployments use the `main` branch.

To deploy with the Vercel CLI from the repository root:

```sh
vercel link --project handc-business-summary --yes
vercel --prod --yes
```

`index.html` extends the supplied `raja_uda_wellness_business_summary.html`, retaining all six embedded concept images. The supplied source HTML and original concept PDF are unchanged.

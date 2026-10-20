# Raja Uda Wellness Studio — Business Summary

Static business summary for the planned Raja Uda wellness studio. The page includes its concept visuals, day/night themes, space tabs, a revised floor plan and print view. It requires no build step or dependencies.

Live site: https://handc-business-summary.vercel.app/#floor-plan

## Financial planner

The [financial plan](https://handc-business-summary.vercel.app/#financials) studies the live HandC app's six offers and models conservative, base and growth cases. It includes an editable startup budget, daily and monthly costs, juice/merch/event contribution, cash break-even and a 12-month demand ramp. Working-founder remuneration and extra growth staffing are included.

Annual founding passes are collected once at opening and recognized in 12 simplified monthly allocations. Monthly cash receipts exclude those advances; visit costs still include founding-member usage. Cash balances show the effect of including and excluding annual prepayments. The RM500k shareholder capital assumption is separate from customer pass receipts. Startup estimates are allowances, not supplier quotes; current electricity, payroll and payment-provider reference links are provided in the planner.

Defaults estimate RM448,800 startup cash and RM39,769 monthly fixed commitments. Startup plus three months of those commitments totals approximately RM568,108. Demand, lease, equipment, product costs and final occupancy need validation. The current app's simulated sales are not used as demand evidence.

- `finance-model.js` — pure calculations shared by the browser and tests.
- `financials.js` — scenario comparison, editable assumptions, cash chart and monthly projection.
- `financials.css` — responsive and print layout.

Run the financial checks from the repository root:

```sh
node --test tests/finance-model.test.cjs
```

The checks cover startup and reserve arithmetic, annual cash versus recognition, membership and event double-counting, fees, growth costs, the first-year cash bridge, ramping, allocation limits and zero-sales cases. Planner edits are saved in browser-local storage; they do not change app prices or admissions.

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

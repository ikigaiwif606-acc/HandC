# Raja Uda Wellness Studio — Business Summary

Static business summary for the planned Raja Uda wellness studio. The page includes its concept visuals, day/night themes, space tabs and print view. It requires no build step or dependencies.

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

`index.html` preserves the supplied `raja_uda_wellness_business_summary.html`, including all six embedded concept images.

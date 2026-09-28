# Mechanism sample

`retrieveAnalogues` from `@hackathon-atlas/analogues` was called on `catalog/hackmit/catalog.json`. The catalog tree is commit `55d231fef73450c9f964739cd803eed6e44b37eb`. That commit includes the mechanism token matching from pull request #32. The catalog blob is `c0048b1607455f42cbe99edf8b0deddfdc5d311b`. The file was last changed in `b16f00e2a8336244b07363250364e04fc2f7046a`. Schema `0.1.0`. `datasetLabel` is `staged-observations`. Catalog `synthetic` is false. Node `v24.21.0`.

The file has 2180 projects, all `synthetic: false`. Each sampled title has one project record. EcoAI is still `prj_06575f6b37c3f9323711a862`.

Every cited claim is `reviewStatus: unreviewed`. A match does not accept a claim. This sample is not a recommendation and not an award inference.

Precision: **NOT MEASURED**. Recall: **NOT MEASURED**.

`realAnalogueCount` equals the analogue list length in every call below. No returned analogue is synthetic. Per-text counts overlap when one analogue shares more than one text, so those counts are not a partition of the analogue count. Project ids are omitted where a mode matched more than 15 projects.

A mechanism token taken from `is code-observed as a library`, `framework`, or `language` is that wording. A token taken from `built with`, dependency wording, or gallery technology wording is that other wording. A shared token is not evidence the package is called. Code-evidence paths on those claims stay unknown.

Gallery track text below is the sentence `The gallery card names the track {label}.` This sample does not assign a problem domain. A shared text taken from a sponsor-challenge string is labeled sponsor-challenge text.

## 2-Player Hot Potato

Project `prj_b99da4af512cfb0f73694b49`. Name claim `clm_1a620ad52bbeb52f7471eecd` is source-reported.

| Mode | Status | Analogues | Shared texts |
| --- | --- | ---: | --- |
| direct | `no-match` | 0 | none |
| mechanism | `unknown` | 0 | none |
| demo | `unknown` | 0 | none |

Direct reason: `The shared text is too generic to justify an analogue.` The project has source-reported `clm_83bf6e9751fac7c7ca8c0c96` (`The gallery card names the track Beginner.`) and `clm_45af4af575a8991ecc74ea85` (`The gallery card names challenge preferences: Beginner.`). Mechanism reason: `No technology-bearing claim was named for this project.` Demo reason: `No demo URL was stated for this project.`

## Window Share

Project `prj_a8478af99b449a19b89c7b2c`. Name claim `clm_66444841b351295814854d82` is source-reported.

| Mode | Status | Analogues | Shared texts |
| --- | --- | ---: | --- |
| direct | `unknown` | 0 | none |
| mechanism | `unknown` | 0 | none |
| demo | `no-match` | 0 | none |

Direct reason: `No track or challenge was named for this project.` Mechanism reason: `No technology-bearing claim was named for this project.` Demo reason: `The shared text is too generic to justify an analogue.` Source-reported `clm_8432050940bc2cbe26363fce` states a demo URL on `youtube.com`.

## TravelAR

Project `prj_caf777f16e6043aaae232c54`. Name claim `clm_a970f598b5d4b8d596273d1c` is source-reported.

| Mode | Status | Analogues | Shared texts |
| --- | --- | ---: | --- |
| direct | `unknown` | 0 | none |
| mechanism | `unknown` | 0 | none |
| demo | `no-match` | 0 | none |

Direct reason: `No track or challenge was named for this project.` Mechanism reason: `No technology-bearing claim was named for this project.` Demo reason: `The shared text is too generic to justify an analogue.` Source-reported `clm_b8340cfc608f02a0a3b2a69f` states a demo URL on `youtube.com`.

## Wirehead

Project `prj_01fd8f7eb80d2f3cddd7e105`. Name claim `clm_3abe6ade6042140c45620980` is source-reported.

| Mode | Status | Analogues | Shared texts |
| --- | --- | ---: | --- |
| direct | `matched` | 330 | 8 texts below |
| mechanism | `unknown` | 0 | none |
| demo | `no-match` | 0 | none |

Mechanism reason: `No technology-bearing claim was named for this project.` Demo reason: `The shared text is too generic to justify an analogue.` Source-reported `clm_56ecf23019fffa4e1faf2a29` states a demo URL on `youtube.com`.

Direct shared texts. The sum of the per-text counts is 584. The analogue count is 330.

| Shared text | Analogues | Query claim wording |
| --- | ---: | --- |
| Education | 185 | Gallery track text on `clm_bd37f4d8f401d69d7dbad962`, and the same item inside challenge preferences on `clm_8f8da9b5c20adf5584f906ac` |
| Anthropic: Best Use Of Claude | 134 | Sponsor-challenge text on `clm_8f8da9b5c20adf5584f906ac` |
| Windsurf Challenge | 90 | Sponsor-challenge text on `clm_8f8da9b5c20adf5584f906ac` |
| Rox Challenge | 58 | Sponsor-challenge text on `clm_8f8da9b5c20adf5584f906ac` |
| Cerebras: Best Use of the Cerebras API | 49 | Sponsor-challenge text on `clm_8f8da9b5c20adf5584f906ac` |
| Arrowstreet: Best Graph Visualization Hack | 30 | Sponsor-challenge text on `clm_8f8da9b5c20adf5584f906ac` |
| Infosys: Carbon-Conscious Intelligence – Building Smarter AI with a Smaller Footprint | 29 | Sponsor-challenge text on `clm_8f8da9b5c20adf5584f906ac` |
| Tandemn Challenge | 9 | Sponsor-challenge text on `clm_8f8da9b5c20adf5584f906ac` |

Both query claims are source-reported. `clm_bd37f4d8f401d69d7dbad962` is `The gallery card names the track Education.` `clm_8f8da9b5c20adf5584f906ac` is `The gallery card names challenge preferences: Education, Windsurf Challenge, Tandemn Challenge, Rox Challenge, Anthropic: Best Use Of Claude, Infosys: Carbon-Conscious Intelligence – Building Smarter AI with a Smaller Footprint, Arrowstreet: Best Graph Visualization Hack, Cerebras: Best Use of the Cerebras API.`

For `Education`, 58 analogues cite a gallery track sentence only, and 127 cite both a gallery track sentence and a challenge-preferences claim. None cite only a challenge-preferences claim. Each of the seven sponsor-challenge texts is cited only through challenge-preferences claims.

## EcoAI

Project `prj_06575f6b37c3f9323711a862`. Name claim `clm_eba2cbf2809f7a79e0dc5af0` is source-reported. The record name is EcoAI.

| Mode | Status | Analogues | Shared texts |
| --- | --- | ---: | --- |
| direct | `matched` | 108 | 2 texts below |
| mechanism | `matched` | 15 | Python, Flask |
| demo | `no-match` | 0 | none |

Demo reason: `The shared text is too generic to justify an analogue.` Source-reported `clm_017e28ab12bb8fc28df629b0` states a demo URL on `youtu.be`.

### Direct

| Shared text | Analogues | Query claim wording |
| --- | ---: | --- |
| Sustainability | 95 | Gallery track text on `clm_009fb40c2b9f2453c13bac7b`, and the same item inside challenge preferences on `clm_7b7eb1dcc5c81f1a6c42c924` |
| Infosys: Carbon-Conscious Intelligence – Building Smarter AI with a Smaller Footprint | 29 | Sponsor-challenge text on `clm_7b7eb1dcc5c81f1a6c42c924` |

Both query claims are source-reported. `clm_009fb40c2b9f2453c13bac7b` is `The gallery card names the track Sustainability.` `clm_7b7eb1dcc5c81f1a6c42c924` is `The gallery card names challenge preferences: Sustainability, Infosys: Carbon-Conscious Intelligence – Building Smarter AI with a Smaller Footprint.`

Sixteen analogues are counted under both texts (95 + 29 − 108). For `Sustainability`, 28 analogues cite a gallery track sentence only, and 67 cite both a gallery track sentence and a challenge-preferences claim. None cite only a challenge-preferences claim. The Infosys text is cited only through challenge-preferences claims.

### Mechanism

The query claim for `Python` is `clm_c0c2c3dbbb17c01d743c919b`, basis `code-observed`, wording `is code-observed as a language`. The query claim for `Flask` is `clm_4b9e1ad2b8711a53088b7bb7`, basis `code-observed`, wording `is code-observed as a framework`. Both statements name revision `cf5f0dbf89bba5adc93f079618d2e8b0d28a72a4`. The code-evidence path on each claim stays unknown. A shared token is not evidence the package is called.

`Python` accounts for 14 analogues: 12 through `built with` wording, and 2 through `is code-observed as a language`. `Flask` accounts for 4 analogues, all through `built with` wording. Three analogues share both texts, so the analogue count is 15.

| Catalog name | Project | Shared text | Analogue claim wording |
| --- | --- | --- | --- |
| AFAR | `prj_bc480cd82100fd7514b5d913` | Flask, Python | built with |
| Core | `prj_29dc7240c29ee7d6c4b5f9b0` | Flask | built with |
| CounterPoint | `prj_8e675ff9e232f30c0400e321` | Python | built with |
| DispenseRX | `prj_b807dc1e12c7d4190288db9a` | Flask, Python | built with |
| Erbgut | `prj_30b242b995ab22c4b256fc66` | Python | code-observed language |
| Eye in the Sky | `prj_75e4a15ac5bd76b3a08ae9ed` | Python | built with |
| HeartFrame | `prj_3bb039d5fe6d7e0e0d93576e` | Python | code-observed language |
| HomeUp | `prj_16a3f9eb10c59e48792ab9fc` | Flask, Python | built with |
| MPGreen | `prj_abc2ed67bf25a4d96a8913af` | Python | built with |
| OnPause | `prj_1d802f2daf083b45562b25b1` | Python | built with |
| Pilot | `prj_bc66034507acc1446eca6e4f` | Python | built with |
| SaveMe | `prj_244253587a8b049756adc007` | Python | built with |
| Text2Test | `prj_46ea43c60eb66a1f0fbe3200` | Python | built with |
| Villager | `prj_b6ed96bf97c46930d6eaa529` | Python | built with |
| VocabViz | `prj_f8cb4077d6a3547e32b098a1` | Python | built with |

Catalog names are the project `name` fields in this file. Other technology claims on EcoAI did not supply a shared text in this result.

# Repeated project titles

Read `catalog/hackmit/catalog.json` on `origin/main` at `1688036e4c71bc99c0bc8d1c3f5566bd55efe62d`. The git blob of that file is `c0048b1607455f42cbe99edf8b0deddfdc5d311b`. That blob is unchanged since `b16f00e2a8336244b07363250364e04fc2f7046a`, the last commit that changed the file.

Schema `0.1.0`. `authoritative` is true. `datasetLabel` is `staged-observations`. The catalog `synthetic` flag is false.

Projects are grouped by the exact `projects[].name` string. The same name is not identity. This review does not merge projects. Identical locators are evidence of a shared repository, not a merge.

## What was counted

**Basis:** catalog fields on the pinned commit. The event name is `events[].name` for the submission whose `projectId` is the project. A repository locator is listed when `repositories[].locator.status` is `known`. Every repository record in this catalog has a known locator (921 records). A project with no repository record has an unknown locator.

2180 projects use 2144 exact names. 30 names belong to more than one project (66 project records). Each of those 66 projects has one submission, and each submission's event id has an event name. None of the 66 projects has `synthetic: true`. No name in the catalog has leading or trailing whitespace.

Locator strings are compared exactly. URLs are not normalized.

For each repeated name the locators are one of:

- **same** — every project has one known locator and the strings are identical.
- **different** — two or more distinct known locator strings are present.
- **unknown** — at least one project has no known locator, and the name has at most one distinct known locator string.

A name shares one identical known locator only when its comparison is **same**.

## Result

| Comparison | Names |
| --- | ---: |
| same | 0 |
| different | 11 |
| unknown | 19 |

0 of the 30 names share one identical known locator. Within a repeated name, no known locator string is recorded on more than one project.

| Name | Projects | Locators |
| --- | ---: | --- |
| Agora | 2 | unknown |
| Alexandria | 2 | unknown |
| AuraTune | 2 | different |
| Band Together | 2 | different |
| BotherCongress | 2 | unknown |
| ClearCare | 2 | unknown |
| Cognify | 2 | different |
| Crescendo | 2 | unknown |
| Echo | 4 | different |
| Goals | 2 | unknown |
| Greener | 2 | different |
| HackMIT2019 | 2 | unknown |
| HomeBites | 2 | unknown |
| Impact | 2 | unknown |
| Jarvis | 2 | unknown |
| LinkUp | 2 | different |
| Maestro | 2 | unknown |
| Moody | 2 | unknown |
| Muse | 2 | unknown |
| Pilot | 2 | different |
| ResQ | 2 | unknown |
| Rewind | 2 | different |
| Ripple | 2 | different |
| Scribe | 3 | unknown |
| Spidey Sense | 2 | different |
| Synapse | 2 | different |
| Tempest | 2 | unknown |
| Thumb Wars | 3 | unknown |
| [N]Vision | 2 | unknown |
| test | 4 | unknown |

Names below are in Unicode code-point order of the exact `name`. Project rows are in project id order. The event name is the catalog event reached through the submission id.

## Repeated names

### Agora

Locators: **unknown**. One project has a known locator. The other project has no repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_5ee05a1cee76e9867088d354` | `sub_c288efc024e3ff8396522921` | HackMIT 2026 | `https://github.com/albertding19/agora` (`repo_8e597b3903e0f3f534eda147`) |
| `prj_62f42dbaa682c258156a78b3` | `sub_efdba6abd3ed283ae360cae8` | HackMIT | unknown |

### Alexandria

Locators: **unknown**. No project with this name has a repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_b389d1795dd0638bf56a8978` | `sub_64db11c5bad607c42a864726` | HackMIT 2025 | unknown |
| `prj_eef1faf121bf5f9a979b814f` | `sub_7cbe70f42d4755e968ef1345` | HackMIT 2019 | unknown |

### AuraTune

Locators: **different**. Known locators: `https://github.com/alexbluo/auratune`, `https://github.com/luciusscala/hackmitmentra`.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_44873ed2d00478ceddcc4b29` | `sub_6f6fff12750253dc2275b270` | HackMIT 2025 | `https://github.com/alexbluo/auratune` (`repo_1445b63200268e263b0adcf1`) |
| `prj_dc58223dd7002719d2e1c9ad` | `sub_2d90b6bf8ac87b8c59c1b6ad` | HackMIT 2025 | `https://github.com/luciusscala/hackmitmentra` (`repo_1f5f62da4ed6eb024dfc9b98`) |

### Band Together

Locators: **different**. Known locators: `https://github.com/sbower213/band-together`, `https://github.com/agduan/hackmit-2026`.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_19c6d421a03c8621e777ad95` | `sub_bd658094276b91309ad92dca` | HackMIT 2017 | `https://github.com/sbower213/band-together` (`repo_44c8c6e6452947e0f55a61b9`) |
| `prj_ddba7607b68ef8db7ae85cc4` | `sub_d372a2b0244a0a1430e6dc32` | HackMIT 2026 | `https://github.com/agduan/hackmit-2026` (`repo_8e291c3010dd04a76ff708cd`) |

### BotherCongress

Locators: **unknown**. No project with this name has a repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_2bf275d2ea06cadc7c0d6573` | `sub_054355e5381cc73d7a236037` | HackMIT | unknown |
| `prj_69eb60f154b0a31685aa33df` | `sub_67a58496c85c0c2037f298b0` | HackMIT | unknown |

### ClearCare

Locators: **unknown**. One project has a known locator. The other project has no repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_4e4a2cec2bc99dda3d2cdd5e` | `sub_457c4aba4afda46c9e2e8111` | HackMIT 2024 | unknown |
| `prj_766d3c68480b4d13353cde19` | `sub_410369e70f50d47af01f1bdc` | HackMIT 2025 | `https://github.com/andrwlinx/hackmit2025-clearcare` (`repo_932a73cc0a262509afdd8062`) |

### Cognify

Locators: **different**. Known locators: `https://github.com/saltyquackerd/cognify`, `https://github.com/thomasha1310/cognify`.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_9365c310cfe0a42da52deb36` | `sub_8d8cc77382703df5811cc097` | HackMIT 2025 | `https://github.com/saltyquackerd/cognify` (`repo_b1d454fe3a79702bc93c1f01`) |
| `prj_cf1429e67a810f282d280513` | `sub_f7f6b4f4a00ac893d8a446e1` | Blueprint 2025 | `https://github.com/thomasha1310/cognify` (`repo_c11bbff89765cac298882b4b`) |

### Crescendo

Locators: **unknown**. One project has a known locator. The other project has no repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_011fda391b8760228c25c5cb` | `sub_8347cb9cb1725f1c09d75c16` | HackMIT 2023 | unknown |
| `prj_978dd93737e8d4a66ef754d9` | `sub_0cc9badcc287d35eb909593e` | HackMIT 2025 | `https://github.com/carolyndo/hackmit` (`repo_855635ce63b92a45256170ed`) |

### Echo

Locators: **different**. Known locators: `https://github.com/ericyan534-dev/echo`, `https://github.com/bchung1201/hackmit25`. `prj_3995f0d81c48798317f6dcee` and `prj_6ef72b2777ba2e4f93f80f32` have no repository record, so their locators are unknown.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_08bd774587c2e90318379732` | `sub_5fca20c95512c456d24e8c27` | HackMIT 2026 | `https://github.com/ericyan534-dev/echo` (`repo_8fc09082dfc82a5c9053f8dd`) |
| `prj_3995f0d81c48798317f6dcee` | `sub_9ca58e1db2169060da707a80` | HackMIT 2023 | unknown |
| `prj_6ef72b2777ba2e4f93f80f32` | `sub_5c88d96afb272935f71cac6f` | HackMIT 2023 | unknown |
| `prj_6f4b59ce53053204ff9c3b76` | `sub_0b9e95de193e8ad85063bcbd` | HackMIT 2025 | `https://github.com/bchung1201/hackmit25` (`repo_a36c186f8c2d9bcd60eccbb9`) |

### Goals

Locators: **unknown**. No project with this name has a repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_e2f608a57e013112ab83812c` | `sub_36c0ac28d36b7e9110e72c50` | HackMIT 2023 | unknown |
| `prj_ea656062ac3b61d557c3c0a1` | `sub_54169ced79dd8a6495b37cf3` | HackMIT 2018 | unknown |

### Greener

Locators: **different**. Known locators: `https://github.com/jogueh/hackmit25`, `https://github.com/benwxng/greener`.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_05590830388a0d22f6a9cdc9` | `sub_db0748c87fb07ff3e92aaac7` | HackMIT 2025 | `https://github.com/jogueh/hackmit25` (`repo_7c3b52a28d9e8fb98d214cfd`) |
| `prj_160d768c07767e423d3630e6` | `sub_e827fc9277e892a6f3273b29` | HackMIT 2025 | `https://github.com/benwxng/greener` (`repo_b3b3bee593e8dd24b5337306`) |

### HackMIT2019

Locators: **unknown**. No project with this name has a repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_69dbe0eb5b735e087010f7f9` | `sub_616bbfe221a1a78f20681c60` | HackMIT 2019 | unknown |
| `prj_ac1ace9cdb36bbc4a1908236` | `sub_e61cbbccb58aafb93420c999` | HackMIT 2019 | unknown |

### HomeBites

Locators: **unknown**. No project with this name has a repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_1fcca123d5e970fd6483cd7d` | `sub_1d8a84881d788c5c7d277f09` | HackMIT 2016 | unknown |
| `prj_37d18941f398ccc1f424df5a` | `sub_44298386cd35d46f3b7239a7` | HackMIT 2016 | unknown |

### Impact

Locators: **unknown**. No project with this name has a repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_ba2993d9099849feb0765991` | `sub_4a3dd50ebb84a9f559866db2` | HackMIT 2019 | unknown |
| `prj_f0f14c068a4a456fc467ff99` | `sub_253b23137f3bfcb2ede79047` | HackMIT 2019 | unknown |

### Jarvis

Locators: **unknown**. One project has a known locator. The other project has no repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_6ec55e7953c7514fa511058e` | `sub_ca23a60e7dc0c89b48c3522a` | HackMIT 2025 | `https://github.com/ryan-rong-24/ran-mentra-photo` (`repo_b08b2601ab88456fc1d5f2cc`) |
| `prj_f307ec211e49701dbd659623` | `sub_5e36f4db8b5cf284fd9310c7` | HackMIT | unknown |

### LinkUp

Locators: **different**. Known locators: `https://github.com/naishagarwal/hackmit-2024-college-counselor`, `https://github.com/donnyphi/linkedup`.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_c9815274dcf5363d5d317f1b` | `sub_ee200a7baa69bc05fa5dd554` | HackMIT 2024 | `https://github.com/naishagarwal/hackmit-2024-college-counselor` (`repo_705afbf9b5c5bd5271c53fd5`) |
| `prj_d6aa5d9fd04903786c719ffb` | `sub_bbc7207a210611327da21448` | HackMIT 2026 | `https://github.com/donnyphi/linkedup` (`repo_1e7ba5f462e6fec7c8c25ab5`) |

### Maestro

Locators: **unknown**. One project has a known locator. The other project has no repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_8c72baa82ed2f41ed074f01c` | `sub_902808ecf6c33a9192ef0063` | HackMIT 2019 | unknown |
| `prj_d130b4bf11612c1255ac9206` | `sub_2f96f89d4f1771fe7aae61ce` | HackMIT 2025 | `https://github.com/raindrop182/maestro` (`repo_43889299eabe41c4f8964b22`) |

### Moody

Locators: **unknown**. No project with this name has a repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_12336146c2c1a425b1ac9951` | `sub_236b17b6415f208144373500` | HackMIT | unknown |
| `prj_b54f07738b8b431d53626d42` | `sub_7652ad7e1f51bb02880b7834` | HackMIT | unknown |

### Muse

Locators: **unknown**. No project with this name has a repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_a97a8bed6ebdea1cbce3eeea` | `sub_4cce83c63c75b57627813a75` | HackMIT 2019 | unknown |
| `prj_dcecbb5c9090c222080bb591` | `sub_2143c3fe52c5b012e0f47588` | HackMIT 2023 | unknown |

### Pilot

Locators: **different**. Known locators: `https://github.com/cqctxs/pilot`, `https://github.com/the-flying-circus/hackmit-2019`.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_64de6ef5f992cc63a34d3992` | `sub_13cd32f67a8c595cec279683` | HackMIT 2026 | `https://github.com/cqctxs/pilot` (`repo_9f7c548642428d5eb6401b8c`) |
| `prj_bc66034507acc1446eca6e4f` | `sub_8f434f94f49c3325a2dd1233` | HackMIT 2019 | `https://github.com/the-flying-circus/hackmit-2019` (`repo_1007f8b26c0d656347d49565`) |

### ResQ

Locators: **unknown**. One project has a known locator. The other project has no repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_07279a585e6ce56da7e4b896` | `sub_8dbb523b3af97adf415d617c` | HackMIT 2018 | unknown |
| `prj_b945f8b405d2eeb7b148a551` | `sub_be51a4b5cae3db80ba6ede8e` | HackMIT 2017 | `https://github.com/resq-hackmit` (`repo_cc88c3a4763c5f20ca09b03d`) |

### Rewind

Locators: **different**. Known locators: `https://github.com/molegod/hackmit-final-2024`, `https://github.com/romirthedev/hackmit2026`.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_51354527a901e28353b31694` | `sub_200f34692974155a0e349a07` | HackMIT 2024 | `https://github.com/molegod/hackmit-final-2024` (`repo_5935204c3d32a5bd56c1da9e`) |
| `prj_75e064caad71912ae76c30ff` | `sub_494b871b7d0b735e50f1cfa0` | HackMIT 2026 | `https://github.com/romirthedev/hackmit2026` (`repo_fad74c84c01bc3a0542304f6`) |

### Ripple

Locators: **different**. Known locators: `https://github.com/rexziywbang/ripple`, `https://github.com/ab0626/global`.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_38e5feb6aa4771368e30daf3` | `sub_c7ded46c44eecbbe01c9f776` | HackMIT 2026 | `https://github.com/rexziywbang/ripple` (`repo_e4802cbe747c2114cd0f0f94`) |
| `prj_f54b52c3b6f94cbf32adf11c` | `sub_5e523bf303c59425e017cf09` | HackMIT 2026 | `https://github.com/ab0626/global` (`repo_93c8310a21efb4a4216b2500`) |

### Scribe

Locators: **unknown**. One project has a known locator. The other projects have no repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_181361f1fdca08f9a1a734c6` | `sub_cf1257ed3d5bca7fa75235df` | HackMIT 2023 | unknown |
| `prj_afa65392bcac80a470b9532e` | `sub_a301c51676c7478e4426a212` | HackMIT 2026 | `https://github.com/cosmicdweller/hackmit26` (`repo_f380b3f1adf6411fa739dfc9`) |
| `prj_cbfcd7f53ad1db9387acecbb` | `sub_d18de8052faef2d673d5c94c` | HackMIT 2023 | unknown |

### Spidey Sense

Locators: **different**. Known locators: `https://github.com/gayathriaravindan/spidey-sense-proj`, `https://github.com/tomasdavola/spideysense`.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_851ae1b224c2250559116a75` | `sub_2e12ac7fab5d1c9e47cea3a4` | HackMIT 2024 | `https://github.com/gayathriaravindan/spidey-sense-proj` (`repo_1d2fa5ee8afc485c7602cc2c`) |
| `prj_85719a33b537e1bc0ed92b37` | `sub_22af83b161eb7b6af46d1d7d` | HackMIT 2026 | `https://github.com/tomasdavola/spideysense` (`repo_cfb35df7964954ee1cb8e491`) |

### Synapse

Locators: **different**. Known locators: `https://github.com/leahuriarte/synapse`, `https://github.com/ericjkge/eeg-tutor`.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_b18d53d78f80c002ca161658` | `sub_ac6a967fc8eb81b1e564a50f` | HackMIT 2025 | `https://github.com/leahuriarte/synapse` (`repo_feae38cfaed403264ef8b723`) |
| `prj_f0030c73a130d2850d011cb8` | `sub_e361ec950fad822c7f1e381a` | HackMIT 2025 | `https://github.com/ericjkge/eeg-tutor` (`repo_a0eac9470505f2bd787d91fd`) |

### Tempest

Locators: **unknown**. No project with this name has a repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_81956526549e499c501772b3` | `sub_d6f98f3ef0786e8ba3094712` | HackMIT 2017 | unknown |
| `prj_8e4a98c906e2eb991418b04e` | `sub_0cc5bfbc746ae1d5c14a53f0` | HackMIT | unknown |

### Thumb Wars

Locators: **unknown**. No project with this name has a repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_33f43592fa3bdd389c651c04` | `sub_13211a65dd5eda8cffa14327` | HackMIT | unknown |
| `prj_360f0168641450ba42c8156a` | `sub_feb3fa7e1824c555fa1f8fc2` | HackMIT | unknown |
| `prj_d6b8e71d091c759ebd0e65cc` | `sub_6b1352cf50d4e227a0edc30b` | HackMIT | unknown |

### [N]Vision

Locators: **unknown**. No project with this name has a repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_77060fc2ac86e3c3883d9bf5` | `sub_aed00344bc7357878024b235` | HackMIT | unknown |
| `prj_cae9d3c00f70789ef813daca` | `sub_79764e5d3e147f3c7997ab34` | HackMIT | unknown |

### test

Locators: **unknown**. One project has a known locator. The other projects have no repository record.

| Project id | Submission id | Event name | Repository locator |
| --- | --- | --- | --- |
| `prj_30dec38d5d57c822da7a3715` | `sub_b7759ce04779c35702e97895` | HackMIT 2024 | unknown |
| `prj_a20ba785aca3e5cc7f64cfab` | `sub_ac86bc566646a1ca620acdac` | Blueprint 2026 | unknown |
| `prj_b7ebf4c28518749e7549b29c` | `sub_5485ec30f4013a281f00864f` | Blueprint 2025 | `https://github.com/anniewang314` (`repo_f42f410051c93eca75709aa9`) |
| `prj_ba76959e24203de6de826e33` | `sub_6533d08767e75ef303872b7d` | HackMIT 2024 | unknown |

## Checks

Counts are a Node read of `catalog/hackmit/catalog.json` at `1688036e4c71bc99c0bc8d1c3f5566bd55efe62d`. No tests were run. No catalog rows were edited. Projects were not merged.

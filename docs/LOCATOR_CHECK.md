# Locator check

Checked `origin/main` at `1688036e4c71bc99c0bc8d1c3f5566bd55efe62d`. This note does not edit the catalog, create projects, or change locators.

Comparison: remove one trailing `.git`, then lowercase. If that leaves a case-only difference, read each URL once from the GitHub repository API and compare the numeric `id`. A failed fetch is unknown. It is not evidence that a link is absent.

No repository code was executed. No emails or other personal data are stored here.

## StudyDate

| Field | Value |
| --- | --- |
| Project | StudyDate (`prj_eaf5e37bd629884d7e5ab099`) |
| Repository | `repo_b938a9e15878e7f53200afff` |
| Source | `https://devpost.com/software/studydate-vxpws8` |
| Catalog locator | `https://github.com/bohanjiangg/studydate` |

Page fetch: one GET, HTTP 200, final URL unchanged, response `Date` `Mon, 28 Sep 2026 19:31:13 GMT`. Title text: `StudyDate | Devpost`.

Visible GitHub link, in Try it out: `https://github.com/BohanJiangg/StudyDate.git`.

After removing one trailing `.git`, the page link is `https://github.com/BohanJiangg/StudyDate`. Lowercasing makes it equal to the catalog locator. The remaining difference is case only.

GitHub API, one read of each URL:

| Request | When | HTTP | Numeric `id` |
| --- | --- | --- | --- |
| `https://api.github.com/repos/BohanJiangg/StudyDate` | `2026-09-28T19:32:36Z` | 200 | `208467031` |
| `https://api.github.com/repos/bohanjiangg/studydate` | `2026-09-28T19:32:50Z` | 200 | `208467031` |

Both reads returned numeric repository id `208467031`. The API `html_url` on both reads was `https://github.com/BohanJiangg/StudyDate`.

**Verdict: same repository.**

## Text2Test

| Field | Value |
| --- | --- |
| Project | Text2Test (`prj_46ea43c60eb66a1f0fbe3200`) |
| Repository | `repo_efd73ea31271ad72ba2fc2d6` |
| Source | `https://devpost.com/software/text2test` |
| Catalog locator | `https://github.com/juliustao/text2test-aws` |

Claim `clm_dd556a840db6d8e5026b9885` says that page also links `https://github.com/nampham148/text2test-server`.

Page fetch: one GET, HTTP 200, final URL unchanged, response `Date` `Mon, 28 Sep 2026 19:32:04 GMT`. Title text: `Text2Test | Devpost`.

Visible GitHub links, both in Try it out:

1. `https://github.com/juliustao/text2test-aws.git`
2. `https://github.com/nampham148/text2test-server`

Link 1, after removing one trailing `.git` and lowercasing, is `https://github.com/juliustao/text2test-aws`. That equals the catalog locator, including case. This was not a case-only difference, so no GitHub API read was made.

**Link 1 verdict: same repository.**

Link 2, after the same normalization, is `https://github.com/nampham148/text2test-server`. The owner and repository name differ from the catalog locator. This was not a case-only difference, so no GitHub API read was made. This fetch shows that href on the page. It does not change the catalog locator.

**Link 2 verdict: different repository.**

## Page script URL

Both HTML responses also contain `https://github.com/newrelic/newrelic-browser-agent/blob/main/docs/warning-codes.md#` inside a script. It is not a Try it out link and was not compared to either catalog locator.

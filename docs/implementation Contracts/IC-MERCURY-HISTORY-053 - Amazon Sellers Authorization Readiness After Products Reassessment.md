# IC-MERCURY-HISTORY-053 — Amazon Sellers Authorization Readiness After Products Reassessment

## Status

Fixture-certified readiness boundary. No runtime change was required: the existing H050 Amazon acceptance service already resolves the H052 effective Products outcome before authorizing or processing Sellers. H053 creates no production authorization, provider task, provider call, retrieval, evidence, history, Atlas change, Current Display change, or downstream authority.

## Effective identity and ownership

`FileAmazonAcceptanceActionRepository.getEffectiveOutcomeForArtifact()` is the sole projection used for downstream Products identity. One valid H052 reassessment supersedes the original outcome only for effective-state projection; the original record remains immutable. No reassessment returns the original outcome. Competing reassessments fail closed.

`AmazonAcceptanceExecutionService` owns the Sellers authorization orchestration. It derives the acceptance artifact, Atlas product, `DATAFORSEO_AMAZON` source, `AMAZON_SELLERS` operation, governed ASIN, Products task/result lineage, rights, and durable spend from repository state. The caller cannot supply or override ASIN, product, source, provider task, price, budget, rights, seller, retailer, result, or downstream state.

## Authorization and request binding

Sellers authorization requires an effective `STRONG_UNIQUE_ASIN` outcome with `sellersAuthorizationEligible=true`. The provider request anchors to that effective governed ASIN only; rank, price, destination preference, retailer, seller, URL, or affiliate status has no identity authority. Existing Sellers authorization or task state prevents duplicate authority/work. Current rights and spend are revalidated, authorization reserves no spend, and later execution remains separately confirmed and single-use.

The production request builder emits only the documented provider request fields: ASIN, United States location, English (United States) language, and priority. Atlas and governance lineage remain internal metadata. The production POST and GET paths use `DataForSeoAmazonMerchantApiClient` for `AMAZON_SELLERS`; no provider transport occurs during authorization.

## Processing and downstream isolation

After a separately authorized future execution and retrieval, H048 remains the processing owner: immutable Sellers result → DF003 retained evidence → merchant/retailer projection → HISTORY-018 comparability → E2J admission or governed block. A third-party marketplace seller is not Amazon retailer identity. Amazon-as-seller still requires explicit merchant review and Atlas retailer validation. Missing condition or delivery price remains null; explicit zero delivery remains zero. Bundle, conditional, coupon, and unknown comparability remain fail closed.

Authorization creates no retained evidence, history, canonical observation, review, E2S qualification, publication, Current Price, public price, Cheapest, Pick, or affiliate CTA authority. Historical admission is not required for the bounded system-acceptance run to demonstrate safe lineage, immutable retention, and governed blocking.

## Operator confirmations

Zero-cost Sellers authorization requires `AUTHORIZE-DATAFORSEO-AMAZON-SELLERS`. A later paid execution requires the distinct `EXECUTE-DATAFORSEO-AMAZON-SELLERS` confirmation and separate operator authorization. H053 does not execute either command.

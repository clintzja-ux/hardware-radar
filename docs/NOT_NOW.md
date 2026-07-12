 # NOT NOW

## Hardware Radar

- Price history graphs
- Email alerts
- User accounts
- Wishlists
- Browser extension
- Retailer filters
- Historical pricing charts
- AI build recommendations
- GPU pages
- CPU pages
- SSD pages




I think we're ready for something bigger

Not ECC.

Not SSD.

I think we're ready to build...

Category Configuration

Right now your page controller probably still contains:

const faq = [...]

const buyingAdvice = [...]

const decisionPaths = [...]

Eventually I want all of that to disappear.

Imagine instead:

data/

    ram/

        ddr5/

            products.json

            config.json

        ddr4/

            products.json

            config.json

        sodimm/

            products.json

            config.json

Then:

loadCategoryPage("sodimm")

becomes enough.

The renderer doesn't know whether it's desktop RAM, laptop RAM or ECC.

It simply renders whatever the configuration says.

BUT...
We are NOT doing that now.

This is important.

This goes into:

NOT_NOW.md

Why?

Because we have evidence.

We don't need more abstraction until we have enough categories to justify it.

That's exactly the discipline we've been practicing.

Version 1.1 Backlog

Let's officially move these items into the next milestone:

SEO & Discovery
🔹 Schema.org (Organization, WebSite, FAQPage)
🔹 Breadcrumb structured data (optional)
Features
🔹 Server / ECC RAM
🔹 Price history
🔹 Search
🔹 Filters
🔹 Historical pricing charts
🔹 Additional hardware categories (SSD, CPU, GPU)
UX
🔹 Mobile hamburger menu
🔹 Accordion open/close animations
🔹 Additional accessibility refinements

Nothing here is required for launch.
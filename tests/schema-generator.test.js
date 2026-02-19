const { expect } = require('chai');
const schemaGenerator = require('../services/schema-generator');

describe('Schema Generator', () => {
  it('should generate valid Product schema', () => {
    const schema = schemaGenerator.generateProductSchema({
      name: 'Test Product',
      description: 'A great product',
      price: 29.99,
      currency: 'USD',
      brand: 'TestBrand',
      sku: 'TP-001',
      url: 'https://store.com/products/test',
      rating: 4.5,
      reviewCount: 120,
    });

    expect(schema['@context']).to.equal('https://schema.org');
    expect(schema['@type']).to.equal('Product');
    expect(schema.name).to.equal('Test Product');
    expect(schema.brand.name).to.equal('TestBrand');
    expect(schema.offers.price).to.equal(29.99);
    expect(schema.aggregateRating.ratingValue).to.equal(4.5);
    expect(schema.aggregateRating.reviewCount).to.equal(120);
  });

  it('should generate valid FAQ schema', () => {
    const schema = schemaGenerator.generateFAQSchema([
      { question: 'What is SEO?', answer: 'Search Engine Optimization.' },
      { question: 'Why is it important?', answer: 'It drives organic traffic.' },
    ]);

    expect(schema['@type']).to.equal('FAQPage');
    expect(schema.mainEntity).to.have.length(2);
    expect(schema.mainEntity[0]['@type']).to.equal('Question');
    expect(schema.mainEntity[0].name).to.equal('What is SEO?');
    expect(schema.mainEntity[0].acceptedAnswer.text).to.equal('Search Engine Optimization.');
  });

  it('should generate valid Article schema', () => {
    const schema = schemaGenerator.generateArticleSchema({
      title: 'SEO Guide 2026',
      description: 'Complete guide to SEO',
      authorName: 'Jane Doe',
      publishDate: '2026-01-15',
      url: 'https://store.com/blog/seo-guide',
      publisherName: 'TestBrand',
    });

    expect(schema['@type']).to.equal('Article');
    expect(schema.headline).to.equal('SEO Guide 2026');
    expect(schema.author.name).to.equal('Jane Doe');
    expect(schema.publisher.name).to.equal('TestBrand');
  });

  it('should generate valid Organization schema', () => {
    const schema = schemaGenerator.generateOrganizationSchema({
      name: 'TestBrand',
      url: 'https://testbrand.com',
      description: 'An awesome ecommerce brand',
      socialProfiles: ['https://twitter.com/testbrand', 'https://instagram.com/testbrand'],
    });

    expect(schema['@type']).to.equal('Organization');
    expect(schema.name).to.equal('TestBrand');
    expect(schema.sameAs).to.have.length(2);
  });

  it('should generate valid Breadcrumb schema', () => {
    const schema = schemaGenerator.generateBreadcrumbSchema([
      { name: 'Home', url: 'https://store.com' },
      { name: 'Blog', url: 'https://store.com/blog' },
      { name: 'SEO Guide', url: 'https://store.com/blog/seo-guide' },
    ]);

    expect(schema['@type']).to.equal('BreadcrumbList');
    expect(schema.itemListElement).to.have.length(3);
    expect(schema.itemListElement[0].position).to.equal(1);
    expect(schema.itemListElement[2].name).to.equal('SEO Guide');
  });

  it('should generate valid HowTo schema', () => {
    const schema = schemaGenerator.generateHowToSchema({
      name: 'How to Optimize Product Pages',
      steps: [
        { name: 'Research keywords', text: 'Find relevant keywords for your product.' },
        { name: 'Write title tag', text: 'Include primary keyword in 50-60 chars.' },
        { name: 'Write meta description', text: 'Compelling 150-160 char description.' },
      ],
    });

    expect(schema['@type']).to.equal('HowTo');
    expect(schema.step).to.have.length(3);
    expect(schema.step[0].position).to.equal(1);
  });

  it('should clean undefined values from output', () => {
    const schema = schemaGenerator.generateProductSchema({
      name: 'Minimal Product',
      price: 10,
    });

    // Should not have undefined values anywhere in the JSON
    const json = JSON.stringify(schema);
    expect(json).to.not.include('undefined');
  });
});

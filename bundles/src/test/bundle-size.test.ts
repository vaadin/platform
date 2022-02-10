import { describe, it } from 'mocha';
import { expect } from 'chai';
import { stat } from 'fs/promises';

describe('vaadin.js', () => {
  const Mbyte = 1024 * 1024;

  it('should have a js size within a range', async() => {
    const size = (await stat('vaadin.js')).size;
    expect(size).to.be.above(4 * Mbyte);
    expect(size).to.be.below(16 * Mbyte);
  });

  it('should have a map size within a range', async() => {
    const size = (await stat('vaadin.js.map')).size;
    expect(size).to.be.above(4 * Mbyte);
    expect(size).to.be.below(16 * Mbyte);
  });
});
const logger = require('../utils/logger');

/**
 * Service for transforming data
 */
const transformerService = {
  /**
   * Transform data using specified transformers
   */
  async transformData(data, transformers) {
    let result = data;
    
    for (const transformer of transformers) {
      const transformFn = this[`_${transformer.type}Transform`];
      if (!transformFn) {
        throw new Error(`Unknown transformer type: ${transformer.type}`);
      }
      
      result = await transformFn(result, transformer.options);
    }
    
    return result;
  },

  /**
   * Count data by category
   */
  countByCategory(data, options = {}) {
    const { field, sort = 'desc' } = options;
    const counts = {};
    
    for (const item of data) {
      const value = item[field];
      counts[value] = (counts[value] || 0) + 1;
    }
    
    const result = Object.entries(counts).map(([key, count]) => ({
      category: key,
      count
    }));
    
    return sort === 'desc' 
      ? result.sort((a, b) => b.count - a.count)
      : result.sort((a, b) => a.count - b.count);
  },

  /**
   * Count data by date
   */
  countByDate(data, options = {}) {
    const { field, format = 'YYYY-MM-DD', groupBy = 'day' } = options;
    const counts = {};
    
    for (const item of data) {
      const date = new Date(item[field]);
      let key;
      
      switch (groupBy) {
        case 'year':
          key = date.getFullYear();
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'day':
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
      
      counts[key] = (counts[key] || 0) + 1;
    }
    
    return Object.entries(counts).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));
  },

  /**
   * Calculate percentage distribution
   */
  percentageDistribution(data, options = {}) {
    const { field } = options;
    const total = data.length;
    const counts = {};
    
    for (const item of data) {
      const value = item[field];
      counts[value] = (counts[value] || 0) + 1;
    }
    
    return Object.entries(counts).map(([key, count]) => ({
      category: key,
      count,
      percentage: (count / total * 100).toFixed(2)
    })).sort((a, b) => b.count - a.count);
  },

  /**
   * Filter data based on criteria
   */
  filterData(data, options = {}) {
    const { criteria } = options;
    return data.filter(item => {
      for (const [field, value] of Object.entries(criteria)) {
        if (item[field] !== value) {
          return false;
        }
      }
      return true;
    });
  },

  /**
   * Aggregate data
   */
  aggregateData(data, options = {}) {
    const { groupBy, operations } = options;
    const result = {};
    
    for (const item of data) {
      const key = groupBy.map(field => item[field]).join('|');
      if (!result[key]) {
        result[key] = { ...item };
        for (const [field, op] of Object.entries(operations)) {
          result[key][field] = op === 'sum' ? 0 : op === 'count' ? 0 : [];
        }
      }
      
      for (const [field, op] of Object.entries(operations)) {
        switch (op) {
          case 'sum':
            result[key][field] += item[field];
            break;
          case 'count':
            result[key][field]++;
            break;
          case 'avg':
            result[key][field].push(item[field]);
            break;
        }
      }
    }
    
    // Calculate averages
    for (const item of Object.values(result)) {
      for (const [field, op] of Object.entries(operations)) {
        if (op === 'avg') {
          const sum = item[field].reduce((a, b) => a + b, 0);
          item[field] = sum / item[field].length;
        }
      }
    }
    
    return Object.values(result);
  },

  /**
   * Join two datasets
   */
  joinData(leftData, rightData, options = {}) {
    const { leftKey, rightKey, type = 'inner' } = options;
    const result = [];
    const rightMap = new Map();
    
    // Create map for right data
    for (const item of rightData) {
      rightMap.set(item[rightKey], item);
    }
    
    // Perform join
    for (const leftItem of leftData) {
      const rightItem = rightMap.get(leftItem[leftKey]);
      
      if (type === 'inner' && !rightItem) continue;
      if (type === 'left' || type === 'inner') {
        result.push({ ...leftItem, ...rightItem });
      }
    }
    
    if (type === 'right') {
      for (const rightItem of rightData) {
        if (!leftData.some(leftItem => leftItem[leftKey] === rightItem[rightKey])) {
          result.push(rightItem);
        }
      }
    }
    
    return result;
  },

  /**
   * Format date
   */
  _formatDate(date, format) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  },

  /**
   * Format month
   */
  _formatMonth(date, format) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month);
  }
};

module.exports = transformerService; 
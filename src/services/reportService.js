const path = require('path');
const fs = require('fs').promises;
const queryService = require('./queryService');
const transformerService = require('./transformerService');
const reportRepository = require('../database/repositories/reportRepository');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Service for managing and generating reports
 */
const reportService = {
  /**
   * Get all reports with pagination and filtering
   */
  async getAllReports(options = {}) {
    return reportRepository.findAll(options);
  },

  /**
   * Get a report by ID
   */
  async getReportById(id) {
    return reportRepository.findById(id);
  },

  /**
   * Create a new report
   */
  async createReport(reportData) {
    return reportRepository.create(reportData);
  },

  /**
   * Update an existing report
   */
  async updateReport(id, reportData) {
    return reportRepository.update(id, reportData);
  },

  /**
   * Delete a report
   */
  async deleteReport(id) {
    return reportRepository.delete(id);
  },

  /**
   * Generate a report
   */
  async generateReport(id, parameters = {}) {
    const report = await this.getReportById(id);
    if (!report) {
      throw new Error('Report not found');
    }

    // Execute all queries
    const queryResults = await this._executeReportQueries(report, parameters);

    // Generate report file
    const reportData = await this._generateReportFile(report, queryResults);

    // Save generation record
    await reportRepository.addGenerationRecord(id, {
      format: report.format,
      filename: reportData.filename,
      generatedAt: new Date()
    });

    return reportData;
  },

  /**
   * Get report file information
   */
  async getReportFileInfo(id, format) {
    const record = await reportRepository.getLatestGenerationRecord(id, format);
    if (!record) {
      return null;
    }

    return {
      filename: record.filename,
      contentType: this._getContentType(format),
      generatedAt: record.generatedAt
    };
  },

  /**
   * Execute report queries
   */
  async _executeReportQueries(reportDef, parameters = {}) {
    const results = [];

    for (const queryDef of reportDef.queries) {
      // Execute query
      const queryResult = await queryService.executeQuery(
        queryDef.queryId,
        { ...parameters, ...queryDef.parameters }
      );

      // Apply transformers if any
      let transformedResult = queryResult;
      if (queryDef.transformers) {
        transformedResult = await transformerService.transformData(
          queryResult,
          queryDef.transformers
        );
      }

      results.push(transformedResult);
    }

    return results;
  },

  /**
   * Generate report file
   */
  async _generateReportFile(reportDef, data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportDef.name}-${timestamp}.${reportDef.format}`;
    const filePath = path.join(config.report.outputDir, filename);

    // Ensure output directory exists
    await fs.mkdir(config.report.outputDir, { recursive: true });

    // Format data based on report format
    let formattedData;
    switch (reportDef.format) {
      case 'json':
        formattedData = this._formatJsonReport(data, reportDef.options);
        break;
      case 'csv':
        formattedData = this._formatCsvReport(data, reportDef.options);
        break;
      case 'html':
        formattedData = this._formatHtmlReport(data, reportDef.options);
        break;
      default:
        throw new Error(`Unsupported report format: ${reportDef.format}`);
    }

    // Write file
    await fs.writeFile(filePath, formattedData);

    return {
      filename,
      path: filePath,
      contentType: this._getContentType(reportDef.format)
    };
  },

  /**
   * Format JSON report
   */
  _formatJsonReport(data, options = {}) {
    return JSON.stringify(data, null, options.pretty ? 2 : 0);
  },

  /**
   * Format CSV report
   */
  _formatCsvReport(data, options = {}) {
    const { delimiter = ',', includeHeaders = true } = options;
    const lines = [];

    // Get headers from first data item
    if (includeHeaders && data.length > 0) {
      const headers = Object.keys(data[0]);
      lines.push(headers.join(delimiter));
    }

    // Add data rows
    for (const item of data) {
      const values = Object.values(item).map(value => {
        if (typeof value === 'string' && value.includes(delimiter)) {
          return `"${value}"`;
        }
        return value;
      });
      lines.push(values.join(delimiter));
    }

    return lines.join('\n');
  },

  /**
   * Format HTML report
   */
  _formatHtmlReport(data, options = {}) {
    const { title, table = true } = options;
    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += `<title>${title || 'Report'}</title>\n`;
    html += this._getHtmlStyles();
    html += '</head>\n<body>\n';

    if (title) {
      html += `<h1>${title}</h1>\n`;
    }

    if (table) {
      html += this._renderHtmlTable(data);
    } else {
      html += this._renderHtmlList(data);
    }

    html += '</body>\n</html>';
    return html;
  },

  /**
   * Render HTML table
   */
  _renderHtmlTable(data) {
    if (data.length === 0) return '<p>No data available</p>';

    let html = '<table>\n<thead>\n<tr>\n';
    
    // Add headers
    const headers = Object.keys(data[0]);
    for (const header of headers) {
      html += `<th>${header}</th>\n`;
    }
    html += '</tr>\n</thead>\n<tbody>\n';

    // Add data rows
    for (const item of data) {
      html += '<tr>\n';
      for (const header of headers) {
        html += `<td>${item[header]}</td>\n`;
      }
      html += '</tr>\n';
    }

    html += '</tbody>\n</table>\n';
    return html;
  },

  /**
   * Render HTML list
   */
  _renderHtmlList(data) {
    if (data.length === 0) return '<p>No data available</p>';

    let html = '<ul>\n';
    for (const item of data) {
      html += '<li>\n';
      html += this._renderHtmlKeyValueTable(item);
      html += '</li>\n';
    }
    html += '</ul>\n';
    return html;
  },

  /**
   * Render key-value table
   */
  _renderHtmlKeyValueTable(data) {
    let html = '<table class="key-value">\n';
    for (const [key, value] of Object.entries(data)) {
      html += '<tr>\n';
      html += `<th>${key}</th>\n`;
      html += `<td>${value}</td>\n`;
      html += '</tr>\n';
    }
    html += '</table>\n';
    return html;
  },

  /**
   * Get HTML styles
   */
  _getHtmlStyles() {
    return `
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 20px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 20px;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
      }
      tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .key-value th {
        width: 30%;
      }
      ul {
        list-style-type: none;
        padding: 0;
      }
      li {
        margin-bottom: 20px;
      }
    </style>
    `;
  },

  /**
   * Get content type for format
   */
  _getContentType(format) {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'html':
        return 'text/html';
      default:
        return 'application/octet-stream';
    }
  }
};

module.exports = reportService; 
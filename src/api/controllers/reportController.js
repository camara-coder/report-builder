const reportService = require('../../services/reportService');
const jobService = require('../../services/jobService');
const logger = require('../../utils/logger');
const path = require('path');
const config = require('../../config');
const fs = require('fs').promises;

class ReportController {
  async getAllReports(req, res, next) {
    try {
      const reports = await reportService.getAllReports(req.query);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  }

  async getReportById(req, res, next) {
    try {
      const report = await reportService.getReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async createReport(req, res, next) {
    try {
      const report = await reportService.createReport(req.body);
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  }

  async updateReport(req, res, next) {
    try {
      const report = await reportService.updateReport(req.params.id, req.body);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req, res, next) {
    try {
      const result = await reportService.deleteReport(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async generateReport(req, res, next) {
    try {
      const report = await reportService.generateReport(req.params.id, req.body);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async generateReportAsync(req, res, next) {
    try {
      const job = await jobService.createJob({
        type: 'report',
        reportId: req.params.id,
        parameters: req.body
      });
      res.status(202).json({ jobId: job._id });
    } catch (error) {
      next(error);
    }
  }

  async downloadReport(req, res, next) {
    try {
      const { id, format } = req.params;
      const fileInfo = await reportService.getReportFileInfo(id, format);
      
      if (!fileInfo) {
        return res.status(404).json({ error: 'Report file not found' });
      }

      const filePath = path.join(config.report.outputDir, fileInfo.filename);
      const stat = await fs.stat(filePath);

      res.setHeader('Content-Type', fileInfo.contentType);
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController(); 
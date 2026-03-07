import * as fs from 'fs';
import * as path from 'path';

export class LocalStorageService {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.ensureDataDir();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private getFilePath(tableName: string): string {
    return path.join(this.dataDir, `${tableName}.json`);
  }

  private readTable(tableName: string): any[] {
    const filePath = this.getFilePath(tableName);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading table ${tableName}:`, error);
      return [];
    }
  }

  private writeTable(tableName: string, data: any[]): void {
    const filePath = this.getFilePath(tableName);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing table ${tableName}:`, error);
      throw error;
    }
  }

  async put(tableName: string, item: any) {
    const data = this.readTable(tableName);
    
    // Remove existing item with same id if exists
    const existingIndex = data.findIndex(d => d.id === item.id);
    if (existingIndex >= 0) {
      data[existingIndex] = item;
    } else {
      data.push(item);
    }
    
    this.writeTable(tableName, data);
    return { success: true };
  }

  async get(tableName: string, key: any) {
    const data = this.readTable(tableName);
    return data.find(item => {
      return Object.keys(key).every(k => item[k] === key[k]);
    });
  }

  async scan(tableName: string, filterExpression?: string, expressionAttributeValues?: any) {
    const data = this.readTable(tableName);
    
    if (!filterExpression) {
      return data;
    }

    // Simple filter implementation for common cases
    if (filterExpression.includes('email = :email') && expressionAttributeValues?.[':email']) {
      return data.filter(item => item.email === expressionAttributeValues[':email']);
    }
    
    if (filterExpression.includes('phone = :phone') && expressionAttributeValues?.[':phone']) {
      return data.filter(item => item.phone === expressionAttributeValues[':phone']);
    }

    // Add more filter cases as needed
    return data;
  }

  async query(tableName: string, keyConditionExpression: string, expressionAttributeValues: any) {
    // For simplicity, treat query like scan with filters
    return this.scan(tableName, keyConditionExpression, expressionAttributeValues);
  }

  async update(tableName: string, key: any, updateExpression: string, expressionAttributeValues: any, expressionAttributeNames?: any) {
    const data = this.readTable(tableName);
    const itemIndex = data.findIndex(item => {
      return Object.keys(key).every(k => item[k] === key[k]);
    });

    if (itemIndex === -1) {
      throw new Error('Item not found');
    }

    // Simple update implementation - just merge the values
    const item = data[itemIndex];
    Object.keys(expressionAttributeValues).forEach(key => {
      const attrName = key.replace(':', '');
      item[attrName] = expressionAttributeValues[key];
    });

    item.updatedAt = new Date().toISOString();
    data[itemIndex] = item;
    this.writeTable(tableName, data);
    
    return item;
  }

  async delete(tableName: string, key: any) {
    const data = this.readTable(tableName);
    const filteredData = data.filter(item => {
      return !Object.keys(key).every(k => item[k] === key[k]);
    });
    
    this.writeTable(tableName, filteredData);
    return { success: true };
  }
}

export const localStorageService = new LocalStorageService();
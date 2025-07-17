/**
 * Base repository implementation with common CRUD operations
 */
export class BaseRepository {
  db;
  constructor(db) {
    this.db = db;
  }
  /**
   * Find record by ID
   */
  async findById(id) {
    const result = await this.db.queryOne(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    return result.result;
  }
  /**
   * Find multiple records with options
   */
  async findMany(options = {}) {
    const { sql, params } = this.buildSelectQuery(options);
    const result = await this.db.query(sql, params);
    return result.results;
  }
  /**
   * Find single record with options
   */
  async findOne(options) {
    const { sql, params } = this.buildSelectQuery({ ...options, limit: 1 });
    const result = await this.db.queryOne(sql, params);
    return result.result;
  }
  /**
   * Create new record
   */
  async create(data) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const fullData = {
      id,
      created_at: now,
      updated_at: now,
      ...data,
    };
    const columns = Object.keys(fullData);
    const placeholders = columns.map(() => "?").join(", ");
    const values = Object.values(fullData);
    await this.db.execute(
      `INSERT INTO ${this.tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );
    return fullData;
  }
  /**
   * Update existing record
   */
  async update(id, data) {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    const columns = Object.keys(updateData);
    const setClause = columns.map((col) => `${col} = ?`).join(", ");
    const values = [...Object.values(updateData), id];
    await this.db.execute(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`, values);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Record with id ${id} not found after update`);
    }
    return updated;
  }
  /**
   * Delete record by ID
   */
  async delete(id) {
    const result = await this.db.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return (result.meta?.changes || 0) > 0;
  }
  /**
   * Count records with options
   */
  async count(options = {}) {
    const { clause, params } = this.buildWhereClause(options.where || []);
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} ${clause}`;
    const result = await this.db.queryOne(sql, params);
    return result.result?.count || 0;
  }
  /**
   * Check if record exists by ID
   */
  async exists(id) {
    const result = await this.db.queryOne(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (result.result?.count || 0) > 0;
  }
  /**
   * Find records by specific column value
   */
  async findBy(column, value) {
    const result = await this.db.query(`SELECT * FROM ${this.tableName} WHERE ${column} = ?`, [
      value,
    ]);
    return result.results;
  }
  /**
   * Find single record by specific column value
   */
  async findOneBy(column, value) {
    const result = await this.db.queryOne(
      `SELECT * FROM ${this.tableName} WHERE ${column} = ? LIMIT 1`,
      [value]
    );
    return result.result;
  }
  /**
   * Soft delete (if the table has a deleted_at column)
   */
  async softDelete(id) {
    try {
      const result = await this.db.execute(
        `UPDATE ${this.tableName} SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        [id]
      );
      return (result.meta?.changes || 0) > 0;
    } catch (_error) {
      // If soft delete fails (no deleted_at column), fall back to hard delete
      return this.delete(id);
    }
  }
  /**
   * Restore soft deleted record
   */
  async restore(id) {
    const result = await this.db.execute(
      `UPDATE ${this.tableName} SET deleted_at = NULL, updated_at = datetime('now') WHERE id = ?`,
      [id]
    );
    return (result.meta?.changes || 0) > 0;
  }
  /**
   * Build SELECT query with options
   */
  buildSelectQuery(options) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];
    // WHERE clause
    if (options.where && options.where.length > 0) {
      const { clause, params: whereParams } = this.buildWhereClause(options.where);
      sql += ` ${clause}`;
      params.push(...whereParams);
    }
    // ORDER BY clause
    if (options.orderBy && options.orderBy.length > 0) {
      const orderClause = options.orderBy
        .map(({ column, direction }) => `${column} ${direction}`)
        .join(", ");
      sql += ` ORDER BY ${orderClause}`;
    }
    // LIMIT and OFFSET
    if (options.limit !== undefined) {
      sql += ` LIMIT ${options.limit}`;
    }
    if (options.offset !== undefined) {
      sql += ` OFFSET ${options.offset}`;
    }
    return { sql, params };
  }
  /**
   * Build WHERE clause from conditions
   */
  buildWhereClause(conditions) {
    if (conditions.length === 0) {
      return { clause: "", params: [] };
    }
    const clauses = [];
    const params = [];
    for (const condition of conditions) {
      switch (condition.operator) {
        case "IS NULL":
        case "IS NOT NULL":
          clauses.push(`${condition.column} ${condition.operator}`);
          break;
        case "IN":
        case "NOT IN":
          if (Array.isArray(condition.value)) {
            const placeholders = condition.value.map(() => "?").join(", ");
            clauses.push(`${condition.column} ${condition.operator} (${placeholders})`);
            params.push(...condition.value);
          }
          break;
        default:
          clauses.push(`${condition.column} ${condition.operator} ?`);
          if (condition.value !== undefined) {
            params.push(condition.value);
          }
      }
    }
    return {
      clause: `WHERE ${clauses.join(" AND ")}`,
      params,
    };
  }
  /**
   * Execute raw SQL query
   */
  async raw(sql, params) {
    const result = await this.db.query(sql, params);
    return result.results;
  }
  /**
   * Execute raw SQL query expecting single result
   */
  async rawOne(sql, params) {
    const result = await this.db.queryOne(sql, params);
    return result.result;
  }
}
//# sourceMappingURL=base-repository.js.map

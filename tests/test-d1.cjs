const {DatabaseSync}=require('node:sqlite');
class D1{
 constructor(file=':memory:'){this.db=new DatabaseSync(file);}
 prepare(sql){return new Statement(this,sql,[]);}
 async batch(statements){this.db.exec('SAVEPOINT cyd_batch');try{const out=[];for(const s of statements){const stmt=this.db.prepare(s.sql);out.push(stmt.columns().length?await s.all():await s.run());}this.db.exec('RELEASE cyd_batch');return out;}catch(e){this.db.exec('ROLLBACK TO cyd_batch');this.db.exec('RELEASE cyd_batch');throw e;}}
 async exec(sql){this.db.exec(sql);return {success:true};}
}
class Statement{
 constructor(owner,sql,args){this.owner=owner;this.sql=sql;this.args=args;}
 bind(...args){if(args.length>100)throw new Error('D1 admite hasta 100 parámetros por consulta.');return new Statement(this.owner,this.sql,args);}
 async first(column){const r=this.owner.db.prepare(this.sql).get(...this.args)||null;return column&&r?r[column]:r;}
 async all(){return {success:true,results:this.owner.db.prepare(this.sql).all(...this.args)};}
 async run(){const r=this.owner.db.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
}
module.exports={D1};

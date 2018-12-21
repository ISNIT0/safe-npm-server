import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToOne } from 'typeorm';
import { PackageVersion } from './packageVersion.model';

@Entity()
export class Report extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() grade: 'A' | 'B' | 'C' | 'D' | 'F' | 'U';
    @Column() comments: string;
    @Column() date: Date;
    @Column() by: string;
    @ManyToOne(type => PackageVersion) packageVersion: PackageVersion;
}